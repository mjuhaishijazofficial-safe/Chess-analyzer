/**
 * UCI driver for a self-hosted Stockfish engine running in a Web Worker.
 *
 * The worker is built from a tiny Blob that `importScripts()` the self-contained
 * asm.js Stockfish build. This is deliberately the most robust setup possible:
 *   - Blob worker  → bypasses any bundler `new Worker()` transforms
 *   - importScripts → classic same-origin load, no module/MIME constraints
 *   - asm.js build  → no separate .wasm fetch, no streaming-instantiate quirks
 *
 * We also ping `uci` until the engine answers `uciok`, which covers the race
 * where early commands are dropped before the engine registers its handler.
 * Verbose console logs are emitted under the `[engine]` tag for debugging.
 */

export interface EngineLine {
  depth: number;
  scoreCp: number | null;
  mate: number | null;
  bestMove: string | null;
  pv: string[];
}

interface Job {
  fen: string;
  depth: number;
  resolve: (line: EngineLine) => void;
}

const ENGINE_PATH = "/engine/stockfish.js"; // self-contained asm.js build
const INIT_TIMEOUT = 20000;
const SEARCH_TIMEOUT = 20000;

export class Engine {
  private worker: Worker | null = null;
  private blobUrl: string | null = null;
  private ready = false;
  private failed = false;
  private gotUciok = false;
  private logged = 0;
  private triedDirect = false;

  private initTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  private readyResolve!: () => void;
  private readyReject!: (e: unknown) => void;
  readonly whenReady: Promise<void>;

  private queue: Job[] = [];
  private current: Job | null = null;
  private partial: EngineLine = blankLine();

  constructor() {
    this.whenReady = new Promise((res, rej) => {
      this.readyResolve = res;
      this.readyReject = rej;
    });
    this.boot();
  }

  private boot(forceDirect = false) {
    let worker: Worker | null = null;
    const absolute = new URL(ENGINE_PATH, window.location.href).href;

    // 1) preferred: blob worker that importScripts the engine
    if (!forceDirect) {
      try {
        const blob = new Blob([`importScripts(${JSON.stringify(absolute)});`], {
          type: "application/javascript",
        });
        this.blobUrl = URL.createObjectURL(blob);
        worker = new Worker(this.blobUrl);
        console.info("[engine] booting via blob worker →", absolute);
      } catch (e) {
        console.warn("[engine] blob worker failed, trying direct worker", e);
      }
    }

    // 2) fallback: direct worker on the engine file
    if (!worker) {
      this.triedDirect = true;
      try {
        worker = new Worker(absolute);
        console.info("[engine] booting via direct worker →", absolute);
      } catch (e) {
        this.fail(e);
        return;
      }
    }

    this.worker = worker;
    worker.onmessage = (e: MessageEvent) => this.onMessage(readLine(e.data));
    worker.onerror = (e: ErrorEvent) => {
      console.error("[engine] worker error:", e.message || e);
      this.retryOrFail(e.message || "worker error");
    };

    // ping until the engine acknowledges
    let pings = 0;
    this.post("uci");
    this.pingTimer = setInterval(() => {
      if (this.gotUciok || this.ready || this.failed) {
        this.clearPing();
        return;
      }
      if (pings++ > 30) return;
      this.post("uci");
    }, 400);

    this.initTimer = setTimeout(() => {
      if (!this.ready) this.retryOrFail("init timeout (no uciok/readyok)");
    }, INIT_TIMEOUT);
  }

  /** On first failure, retry once with a plain direct worker before giving up. */
  private retryOrFail(reason: unknown) {
    if (this.ready || this.failed) return;
    if (!this.triedDirect) {
      console.warn("[engine] retrying with direct worker after:", reason);
      this.clearPing();
      if (this.initTimer) clearTimeout(this.initTimer);
      this.gotUciok = false;
      this.logged = 0;
      try {
        this.worker?.terminate();
      } catch {
        /* ignore */
      }
      if (this.blobUrl) {
        URL.revokeObjectURL(this.blobUrl);
        this.blobUrl = null;
      }
      this.boot(true);
      return;
    }
    this.fail(reason);
  }

  private clearPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private fail(reason: unknown) {
    if (this.ready || this.failed) return;
    this.failed = true;
    this.clearPing();
    if (this.initTimer) clearTimeout(this.initTimer);
    console.warn("[engine] unavailable:", reason);
    this.readyReject(reason);
    try {
      this.worker?.terminate();
    } catch {
      /* ignore */
    }
  }

  private post(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private onMessage(line: string) {
    if (!line) return;
    if (this.logged < 6) {
      console.debug("[engine]", line);
      this.logged++;
    }

    if (!this.gotUciok && line.includes("uciok")) {
      this.gotUciok = true;
      this.clearPing();
      console.info("[engine] uciok ✓");
      this.post("setoption name Hash value 16");
      this.post("isready");
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

    if (line.startsWith("info") && line.includes(" score ")) {
      this.partial = parseInfo(line, this.partial);
      return;
    }

    if (line.startsWith("bestmove")) {
      const best = line.split(/\s+/)[1];
      this.partial.bestMove = best && best !== "(none)" ? best : null;
      this.finish();
    }
  }

  private finish() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = null;
    const job = this.current;
    this.current = null;
    if (job) job.resolve(this.partial);
    this.pump();
  }

  private pump() {
    if (!this.ready || this.current || this.queue.length === 0) return;
    this.current = this.queue.shift()!;
    this.partial = blankLine();
    this.post(`position fen ${this.current.fen}`);
    this.post(`go depth ${this.current.depth}`);
    this.searchTimer = setTimeout(() => {
      this.post("stop");
      this.finish();
    }, SEARCH_TIMEOUT);
  }

  analyze(fen: string, depth: number): Promise<EngineLine> {
    return new Promise((resolve) => {
      this.queue.push({ fen, depth, resolve });
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
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.worker = null;
  }
}

function blankLine(): EngineLine {
  return { depth: 0, scoreCp: null, mate: null, bestMove: null, pv: [] };
}

function parseInfo(line: string, prev: EngineLine): EngineLine {
  const next: EngineLine = { ...prev };
  const depth = /\bdepth (\d+)/.exec(line);
  if (depth) next.depth = Number(depth[1]);

  const score = /score (cp|mate) (-?\d+)/.exec(line);
  if (score) {
    if (score[1] === "cp") {
      next.scoreCp = Number(score[2]);
      next.mate = null;
    } else {
      next.mate = Number(score[2]);
      next.scoreCp = null;
    }
  }

  const pv = / pv (.+)$/.exec(line);
  if (pv) next.pv = pv[1].trim().split(/\s+/);
  return next;
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
