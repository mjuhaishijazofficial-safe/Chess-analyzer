/**
 * UCI driver for self-hosted Stockfish 18 (NNUE) running in a Web Worker.
 *
 * Engine selection, strongest first:
 *   1. stockfish-18-lite.js        — multi-threaded NNUE (needs SharedArrayBuffer
 *                                     i.e. a cross-origin-isolated page)
 *   2. stockfish-18-lite-single.js — single-threaded NNUE (works everywhere)
 *   3. stockfish.js                — 2019 asm.js build (last-ditch fallback)
 *
 * These builds load an external .wasm whose URL is derived from the worker
 * script (`.js → .wasm`), so we must use a DIRECT same-origin worker (no blob).
 * We run with MultiPV 2 so the reviewer can tell "only good move" situations
 * apart from positions with several decent options.
 */

export interface PvLine {
  scoreCp: number | null; // side-to-move perspective
  mate: number | null; // side-to-move perspective
  move: string | null; // first move of the PV, UCI
  pv: string[]; // UCI moves
}

export interface EngineEval {
  depth: number;
  lines: PvLine[]; // index 0 = best (multipv 1), index 1 = 2nd best
  bestMove: string | null;
}

export interface AnalyzeOpts {
  depth?: number;
  movetime?: number; // milliseconds
}

interface Job {
  fen: string;
  opts: AnalyzeOpts;
  resolve: (e: EngineEval) => void;
}

const ASSET = {
  mt: "/engine/stockfish-18-lite.js",
  single: "/engine/stockfish-18-lite-single.js",
  asm: "/engine/stockfish.js",
};

const INIT_TIMEOUT = 45000;
const SEARCH_TIMEOUT = 30000;
const MULTIPV = 2;

/** Stockfish's own UCI_Elo knob only goes this low/high. */
export const STOCKFISH_MIN_ELO = 1320;
export const STOCKFISH_MAX_ELO = 3190;
export const BOT_MIN_ELO = 100;
export const BOT_MAX_ELO = 3200;

/**
 * Below Stockfish's UCI_Elo floor (1320) we fall back to the coarser
 * "Skill Level" (0-20) knob, which produces genuinely weak/beginner-like
 * play instead of a strong engine pretending to be bad.
 */
function eloToSkillLevel(elo: number): number {
  const t = (elo - BOT_MIN_ELO) / (STOCKFISH_MIN_ELO - BOT_MIN_ELO); // 0..1 across 100-1320
  return Math.round(Math.max(0, Math.min(1, t)) * 20);
}

function isolated(): boolean {
  return (
    typeof SharedArrayBuffer !== "undefined" &&
    typeof globalThis !== "undefined" &&
    (globalThis as unknown as { crossOriginIsolated?: boolean })
      .crossOriginIsolated === true
  );
}

export class Engine {
  private worker: Worker | null = null;
  private candidates: string[];
  private candidateIdx = 0;

  private ready = false;
  private failed = false;
  private gotUciok = false;

  multiThreaded = false;
  threads = 1;

  private initTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  private readyResolve!: () => void;
  private readyReject!: (e: unknown) => void;
  readonly whenReady: Promise<void>;

  private queue: Job[] = [];
  private current: Job | null = null;
  private lines = new Map<number, PvLine>();
  private curDepth = 0;

  /** null = full strength (analysis/review mode). */
  private strength: number | null = null;

  constructor() {
    this.candidates = isolated()
      ? [ASSET.mt, ASSET.single, ASSET.asm]
      : [ASSET.single, ASSET.asm];
    this.whenReady = new Promise((res, rej) => {
      this.readyResolve = res;
      this.readyReject = rej;
    });
    this.boot();
  }

  private boot() {
    if (this.failed) return;
    if (this.candidateIdx >= this.candidates.length) {
      this.fail("no engine candidate could start");
      return;
    }
    const url = this.candidates[this.candidateIdx];
    this.multiThreaded = url === ASSET.mt;
    this.gotUciok = false;

    try {
      const w = new Worker(new URL(url, window.location.href).href);
      this.worker = w;
      w.onmessage = (e: MessageEvent) => this.onMessage(readLine(e.data));
      w.onerror = (e: ErrorEvent) => {
        console.error("[engine] worker error:", e.message || e);
        this.nextCandidate("worker error");
      };
      console.info(
        `[engine] booting ${url} (${this.multiThreaded ? "multi" : "single"}-threaded)`,
      );
    } catch (e) {
      this.nextCandidate(e);
      return;
    }

    let pings = 0;
    this.post("uci");
    this.pingTimer = setInterval(() => {
      if (this.gotUciok || this.ready || this.failed) {
        this.clearPing();
        return;
      }
      if (pings++ > 40) return;
      this.post("uci");
    }, 400);

    this.initTimer = setTimeout(() => {
      if (!this.ready) this.nextCandidate("init timeout");
    }, INIT_TIMEOUT);
  }

  private nextCandidate(reason: unknown) {
    if (this.ready || this.failed) return;
    console.warn("[engine] candidate failed:", reason, "→ trying next");
    this.clearPing();
    if (this.initTimer) clearTimeout(this.initTimer);
    try {
      this.worker?.terminate();
    } catch {
      /* ignore */
    }
    this.worker = null;
    this.candidateIdx += 1;
    this.boot();
  }

  private fail(reason: unknown) {
    if (this.ready || this.failed) return;
    this.failed = true;
    this.clearPing();
    if (this.initTimer) clearTimeout(this.initTimer);
    console.warn("[engine] unavailable:", reason);
    this.readyReject(reason);
  }

  private clearPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private post(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private onMessage(line: string) {
    if (!line) return;

    if (!this.gotUciok && line.includes("uciok")) {
      this.gotUciok = true;
      this.clearPing();
      if (this.multiThreaded) {
        this.threads = Math.max(
          1,
          Math.min((navigator.hardwareConcurrency || 4) - 1, 8),
        );
        this.post(`setoption name Threads value ${this.threads}`);
        this.post("setoption name Hash value 64");
      } else {
        this.post("setoption name Hash value 32");
      }
      this.post(`setoption name MultiPV value ${MULTIPV}`);
      this.post("isready");
      console.info(
        `[engine] uciok ✓ (${this.multiThreaded ? `${this.threads} threads` : "1 thread"})`,
      );
      return;
    }

    if (line.includes("readyok") && !this.ready) {
      this.ready = true;
      if (this.initTimer) clearTimeout(this.initTimer);
      console.info("[engine] ready ✓");
      this.readyResolve();
      this.pump();
      return;
    }

    if (line.startsWith("info") && line.includes(" multipv ") && line.includes(" score ")) {
      this.parseInfo(line);
      return;
    }

    if (line.startsWith("bestmove")) {
      const best = line.split(/\s+/)[1];
      this.finish(best && best !== "(none)" ? best : null);
    }
  }

  private parseInfo(line: string) {
    const d = /\bdepth (\d+)/.exec(line);
    const depth = d ? Number(d[1]) : 0;
    // a fresh, deeper iteration supersedes shallower PV lines
    if (depth > this.curDepth) {
      this.curDepth = depth;
    }
    const mpv = /\bmultipv (\d+)/.exec(line);
    const idx = mpv ? Number(mpv[1]) : 1;

    let scoreCp: number | null = null;
    let mate: number | null = null;
    const sc = /score (cp|mate) (-?\d+)/.exec(line);
    if (sc) {
      if (sc[1] === "cp") scoreCp = Number(sc[2]);
      else mate = Number(sc[2]);
    }
    const pvMatch = / pv (.+)$/.exec(line);
    const pv = pvMatch ? pvMatch[1].trim().split(/\s+/) : [];

    this.lines.set(idx, { scoreCp, mate, move: pv[0] ?? null, pv });
  }

  private finish(bestMove: string | null) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = null;
    const job = this.current;
    this.current = null;
    if (job) {
      const lines: PvLine[] = [];
      const l1 = this.lines.get(1);
      const l2 = this.lines.get(2);
      if (l1) lines.push(l1);
      if (l2) lines.push(l2);
      job.resolve({ depth: this.curDepth, lines, bestMove });
    }
    this.pump();
  }

  private pump() {
    if (!this.ready || this.current || this.queue.length === 0) return;
    this.current = this.queue.shift()!;
    this.lines.clear();
    this.curDepth = 0;
    const { depth, movetime } = this.current.opts;
    this.post(`position fen ${this.current.fen}`);
    if (movetime && depth) {
      this.post(`go depth ${depth} movetime ${movetime}`);
    } else if (movetime) {
      this.post(`go movetime ${movetime}`);
    } else {
      this.post(`go depth ${depth ?? 14}`);
    }
    this.searchTimer = setTimeout(() => {
      this.post("stop");
      this.finish(this.lines.get(1)?.move ?? null);
    }, SEARCH_TIMEOUT);
  }

  async setStrength(elo: number | null): Promise<void> {
    await this.whenReady;
    this.strength = elo;

    if (elo === null) {
      this.post("setoption name UCI_LimitStrength value false");
      this.post("setoption name Skill Level value 20");
      return;
    }

    const clamped = Math.max(BOT_MIN_ELO, Math.min(BOT_MAX_ELO, elo));
    if (clamped < STOCKFISH_MIN_ELO) {
      this.post("setoption name UCI_LimitStrength value false");
      this.post(`setoption name Skill Level value ${eloToSkillLevel(clamped)}`);
    } else {
      this.post("setoption name Skill Level value 20");
      this.post("setoption name UCI_LimitStrength value true");
      this.post(
        `setoption name UCI_Elo value ${Math.min(clamped, STOCKFISH_MAX_ELO)}`,
      );
    }
  }

  get currentStrength(): number | null {
    return this.strength;
  }

  analyze(fen: string, opts: AnalyzeOpts): Promise<EngineEval> {
    return new Promise((resolve) => {
      this.queue.push({ fen, opts, resolve });
      this.pump();
    });
  }

  destroy() {
    this.failed = true;
    this.clearPing();
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.initTimer) clearTimeout(this.initTimer);
    this.queue = [];
    this.current = null;
    try {
      this.post("quit");
      this.worker?.terminate();
    } catch {
      /* ignore */
    }
    this.worker = null;
  }
}

function readLine(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const d = data as { data?: unknown; line?: unknown };
    if (typeof d.data === "string") return d.data;
    if (typeof d.line === "string") return d.line;
  }
  return String(data ?? "");
}
