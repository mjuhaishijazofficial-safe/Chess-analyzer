"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "./board";
import { EvalBar } from "./eval-bar";
import { MoveList } from "./move-list";
import { Engine } from "@/lib/engine";
import {
  CLASS_META,
  classifyMove,
  lineToCpStm,
  summarize,
  winPercent,
  type Classification,
  type MoveReview,
} from "@/lib/chess-review";

const DEPTH = 12;

type EngineState = "loading" | "running" | "done" | "unavailable";

interface Props {
  pgn: string;
  whiteName: string;
  blackName: string;
  playerColor: "white" | "black";
}

export function GameReview({ pgn, whiteName, blackName, playerColor }: Props) {
  const parsed = useMemo(() => parsePgn(pgn), [pgn]);
  const [moves, setMoves] = useState<MoveReview[]>(parsed.moves);
  const [startEval, setStartEval] = useState<number | null>(null);
  const [ply, setPly] = useState(0);
  const [orientation, setOrientation] = useState<"white" | "black">(playerColor);
  const [showArrows, setShowArrows] = useState(true);
  const [engineState, setEngineState] = useState<EngineState>("loading");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const N = parsed.moves.length;

  /* ------------------------- engine analysis ------------------------ */
  useEffect(() => {
    if (parsed.error || N === 0) {
      setEngineState("unavailable");
      return;
    }
    let cancelled = false;
    const engine = new Engine();
    const working = parsed.moves.map((m) => ({ ...m }));
    const cpStm: number[] = [];
    const bestUci: (string | null)[] = [];

    engine.whenReady
      .then(async () => {
        if (cancelled) return;
        setEngineState("running");
        const total = N + 1;
        setProgress({ done: 0, total });

        for (let k = 0; k <= N; k++) {
          if (cancelled) return;
          const fen = k === 0 ? parsed.startFen : working[k - 1].fenAfter;
          const whiteToMove = fen.split(" ")[1] === "w";

          const probe = new Chess(fen);
          let stm: number;
          let best: string | null = null;
          if (probe.isCheckmate()) {
            stm = -100000; // side to move is mated
          } else if (probe.isStalemate() || probe.isDraw()) {
            stm = 0;
          } else {
            const line = await engine.analyze(fen, DEPTH);
            if (cancelled) return;
            stm = lineToCpStm(line);
            best = line.bestMove;
          }
          cpStm[k] = stm;
          bestUci[k] = best;

          const cpWhite = whiteToMove ? stm : -stm;
          if (k === 0) {
            setStartEval(cpWhite);
          } else {
            const mv = working[k - 1];
            mv.evalWhiteCp = cpWhite;

            // classify the move that produced this position
            const beforeStm = cpStm[k - 1];
            const winBefore = winPercent(beforeStm);
            const winAfter = winPercent(-stm);
            const bUci = bestUci[k - 1];
            const probeBefore = new Chess(mv.fenBefore);
            const legalCount = probeBefore.moves().length;
            const { classification, winDrop, accuracy } = classifyMove({
              playedUci: mv.uci,
              bestUci: bUci,
              winBefore,
              winAfter,
              legalCount,
            });
            mv.bestUci = bUci;
            mv.bestSan = bUci ? uciToSan(mv.fenBefore, bUci) : null;
            mv.classification = classification;
            mv.winDrop = winDrop;
            mv.accuracy = accuracy;
            mv.analyzed = true;
            setMoves(working.map((m) => ({ ...m })));
          }
          setProgress({ done: k + 1, total });
        }
        if (!cancelled) setEngineState("done");
      })
      .catch(() => {
        if (!cancelled) setEngineState("unavailable");
      });

    return () => {
      cancelled = true;
      engine.destroy();
    };
  }, [parsed, N]);

  /* --------------------------- navigation --------------------------- */
  const go = useCallback(
    (p: number) => setPly(Math.max(0, Math.min(N, p))),
    [N],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(ply - 1);
      else if (e.key === "ArrowRight") go(ply + 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(N);
      else if (e.key.toLowerCase() === "f")
        setOrientation((o) => (o === "white" ? "black" : "white"));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ply, N, go]);

  /* ----------------------- derived current node --------------------- */
  const fen = ply === 0 ? parsed.startFen : moves[ply - 1].fenAfter;
  const lastMove =
    ply === 0
      ? null
      : {
          from: moves[ply - 1].uci.slice(0, 2),
          to: moves[ply - 1].uci.slice(2, 4),
        };
  const checkSquare = useMemo(() => checkSquareOf(fen), [fen]);
  const evalWhite = ply === 0 ? startEval : moves[ply - 1].evalWhiteCp;

  const playedMove = ply >= 1 ? moves[ply - 1] : null;
  const forwardBest = moves[ply]?.bestUci ?? null;
  const forwardBestSan = moves[ply]?.bestSan ?? null;
  const arrow =
    showArrows && forwardBest
      ? { from: forwardBest.slice(0, 2), to: forwardBest.slice(2, 4) }
      : null;

  const summary = useMemo(() => summarize(moves), [moves]);

  if (parsed.error) {
    return (
      <div className="panel rounded-2xl p-6 text-sm text-muted">
        We couldn&apos;t parse this game&apos;s moves. It may use a non-standard
        format.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* board column */}
      <div>
        <PlayerTag
          name={orientation === "white" ? blackName : whiteName}
          color={orientation === "white" ? "black" : "white"}
          accuracy={
            orientation === "white"
              ? summary.black.accuracy
              : summary.white.accuracy
          }
        />
        <div className="my-2 flex items-stretch gap-3">
          <div className="w-6 shrink-0 sm:w-7">
            <EvalBar cpWhite={evalWhite} orientation={orientation} />
          </div>
          <div className="min-w-0 flex-1">
            <Board
              fen={fen}
              orientation={orientation}
              lastMove={lastMove}
              arrow={arrow}
              checkSquare={checkSquare}
            />
          </div>
        </div>
        <PlayerTag
          name={orientation === "white" ? whiteName : blackName}
          color={orientation === "white" ? "white" : "black"}
          accuracy={
            orientation === "white"
              ? summary.white.accuracy
              : summary.black.accuracy
          }
        />

        <Controls
          ply={ply}
          total={N}
          onGo={go}
          orientation={orientation}
          onFlip={() =>
            setOrientation((o) => (o === "white" ? "black" : "white"))
          }
          showArrows={showArrows}
          onToggleArrows={() => setShowArrows((s) => !s)}
        />
      </div>

      {/* side column */}
      <div className="space-y-4">
        <EngineStatus state={engineState} progress={progress} />

        <AnalysisPanel
          ply={ply}
          playedMove={playedMove}
          evalWhite={evalWhite}
          forwardBestSan={forwardBestSan}
          engineState={engineState}
        />

        <div className="panel rounded-2xl p-3">
          {N > 0 ? (
            <MoveList moves={moves} currentPly={ply} onSelect={go} />
          ) : (
            <p className="p-3 text-sm text-muted">This game has no moves.</p>
          )}
        </div>

        <AccuracySummary
          whiteName={whiteName}
          blackName={blackName}
          summary={summary}
        />
      </div>
    </div>
  );
}

/* ============================ sub-views =========================== */

function PlayerTag({
  name,
  color,
  accuracy,
}: {
  name: string;
  color: "white" | "black";
  accuracy: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-3 w-3 rounded-full border border-line-strong ${
            color === "white" ? "bg-[#f5f7fa]" : "bg-[#15181d]"
          }`}
        />
        <span className="truncate text-sm font-medium text-fg">{name}</span>
      </div>
      {accuracy != null && (
        <span className="rounded-md bg-panel-2 px-2 py-0.5 font-mono text-xs text-muted">
          {accuracy}% acc
        </span>
      )}
    </div>
  );
}

function Controls({
  ply,
  total,
  onGo,
  orientation,
  onFlip,
  showArrows,
  onToggleArrows,
}: {
  ply: number;
  total: number;
  onGo: (p: number) => void;
  orientation: "white" | "black";
  onFlip: () => void;
  showArrows: boolean;
  onToggleArrows: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <NavBtn label="⏮" onClick={() => onGo(0)} disabled={ply === 0} />
        <NavBtn label="◀" onClick={() => onGo(ply - 1)} disabled={ply === 0} />
        <span className="px-2 font-mono text-xs text-muted tabular-nums">
          {ply}/{total}
        </span>
        <NavBtn label="▶" onClick={() => onGo(ply + 1)} disabled={ply === total} />
        <NavBtn label="⏭" onClick={() => onGo(total)} disabled={ply === total} />
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleArrows}
          title="Toggle engine arrow"
          className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs transition ${
            showArrows
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-line bg-panel text-muted hover:text-fg"
          }`}
        >
          ➤ hint
        </button>
        <button
          onClick={onFlip}
          title="Flip board (f)"
          className="rounded-lg border border-line bg-panel px-2.5 py-1.5 font-mono text-xs text-muted transition hover:text-fg"
        >
          ⇅ {orientation === "white" ? "W" : "B"}
        </button>
      </div>
    </div>
  );
}

function NavBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-sm text-fg transition hover:border-line-strong disabled:opacity-30"
    >
      {label}
    </button>
  );
}

function EngineStatus({
  state,
  progress,
}: {
  state: EngineState;
  progress: { done: number; total: number };
}) {
  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="panel rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              state === "unavailable"
                ? "bg-rose"
                : state === "done"
                  ? "bg-accent"
                  : "bg-amber animate-pulse-dot"
            }`}
          />
          Stockfish · depth {DEPTH}
        </span>
        <span className="font-mono text-xs text-faint">
          {state === "loading" && "loading…"}
          {state === "running" && `${progress.done}/${progress.total}`}
          {state === "done" && "complete"}
          {state === "unavailable" && "unavailable"}
        </span>
      </div>
      {(state === "running" || state === "done") && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${state === "done" ? 100 : pct}%` }}
          />
        </div>
      )}
      {state === "unavailable" && (
        <p className="mt-2 text-xs leading-relaxed text-faint">
          Engine analysis couldn&apos;t run in this browser — you can still
          replay every move below.
        </p>
      )}
    </div>
  );
}

function AnalysisPanel({
  ply,
  playedMove,
  evalWhite,
  forwardBestSan,
  engineState,
}: {
  ply: number;
  playedMove: MoveReview | null;
  evalWhite: number | null;
  forwardBestSan: string | null;
  engineState: EngineState;
}) {
  const meta: Classification | null = playedMove?.classification ?? null;
  const cm = meta ? CLASS_META[meta] : null;
  const showBetter =
    playedMove &&
    playedMove.bestSan &&
    meta &&
    !["best", "excellent", "forced", "book"].includes(meta);

  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          // review
        </span>
        <span className="font-mono text-sm tabular-nums text-muted">
          {evalWhite != null ? formatEvalShort(evalWhite) : "—"}
        </span>
      </div>

      {ply === 0 ? (
        <div className="mt-3">
          <p className="text-sm text-muted">
            Starting position. Step forward to review each move.
          </p>
          {forwardBestSan && (
            <p className="mt-2 text-sm text-fg">
              Engine suggests{" "}
              <span className="font-mono font-semibold text-accent">
                {forwardBestSan}
              </span>
              .
            </p>
          )}
        </div>
      ) : playedMove ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-fg">
              {playedMove.moveNo}
              {playedMove.color === "w" ? "." : "…"} {playedMove.san}
            </span>
            {cm ? (
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${cm.chip} ${cm.text}`}
              >
                <span>{cm.symbol}</span>
                {cm.label}
              </span>
            ) : engineState !== "unavailable" ? (
              <span className="font-mono text-xs text-faint">analyzing…</span>
            ) : null}
          </div>

          {cm && <p className="text-sm leading-relaxed text-muted">{cm.blurb}</p>}

          {showBetter && (
            <div className="rounded-lg border border-line bg-panel-2 p-3 text-sm">
              <span className="text-muted">Best was </span>
              <span className="font-mono font-semibold text-accent">
                {playedMove.bestSan}
              </span>
              {playedMove.winDrop != null && playedMove.winDrop >= 1 && (
                <span className="text-faint">
                  {" "}
                  · −{playedMove.winDrop.toFixed(0)}% win chance
                </span>
              )}
            </div>
          )}

          {forwardBestSan && (
            <p className="text-xs text-faint">
              Engine&apos;s move here:{" "}
              <span className="font-mono text-muted">{forwardBestSan}</span>
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AccuracySummary({
  whiteName,
  blackName,
  summary,
}: {
  whiteName: string;
  blackName: string;
  summary: ReturnType<typeof summarize>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SideCard name={whiteName} color="white" side={summary.white} />
      <SideCard name={blackName} color="black" side={summary.black} />
    </div>
  );
}

function SideCard({
  name,
  color,
  side,
}: {
  name: string;
  color: "white" | "black";
  side: ReturnType<typeof summarize>["white"];
}) {
  return (
    <div className="panel rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full border border-line-strong ${
            color === "white" ? "bg-[#f5f7fa]" : "bg-[#15181d]"
          }`}
        />
        <span className="truncate text-sm font-medium text-fg">{name}</span>
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-fg">
        {side.accuracy != null ? `${side.accuracy}` : "—"}
        <span className="ml-1 text-sm font-normal text-faint">% acc</span>
      </div>
      <div className="mt-3 space-y-1 text-xs">
        <CountRow label="Best" n={side.counts.best} cls="best" />
        <CountRow label="Inaccuracies" n={side.counts.inaccuracy} cls="inaccuracy" />
        <CountRow label="Mistakes" n={side.counts.mistake} cls="mistake" />
        <CountRow label="Blunders" n={side.counts.blunder} cls="blunder" />
      </div>
    </div>
  );
}

function CountRow({
  label,
  n,
  cls,
}: {
  label: string;
  n: number;
  cls: Classification;
}) {
  const meta = CLASS_META[cls];
  return (
    <div className="flex items-center justify-between">
      <span className={`flex items-center gap-1.5 ${meta.text}`}>
        <span>{meta.symbol}</span>
        <span className="text-muted">{label}</span>
      </span>
      <span className="font-mono tabular-nums text-fg">{n}</span>
    </div>
  );
}

/* ============================ helpers ============================= */

interface ParsedPgn {
  moves: MoveReview[];
  startFen: string;
  error: boolean;
}

function parsePgn(pgn: string): ParsedPgn {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    const startFen =
      history.length > 0
        ? history[0].before
        : new Chess().fen();

    const moves: MoveReview[] = history.map((h, i) => ({
      ply: i + 1,
      moveNo: Math.floor(i / 2) + 1,
      color: h.color,
      san: h.san,
      uci: `${h.from}${h.to}${h.promotion ?? ""}`,
      fenBefore: h.before,
      fenAfter: h.after,
      evalWhiteCp: null,
      bestUci: null,
      bestSan: null,
      classification: null,
      winDrop: null,
      accuracy: null,
      analyzed: false,
    }));

    return { moves, startFen, error: false };
  } catch {
    return { moves: [], startFen: new Chess().fen(), error: true };
  }
}

function uciToSan(fen: string, uci: string): string | null {
  try {
    const c = new Chess(fen);
    const mv = c.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return mv ? mv.san : null;
  } catch {
    return null;
  }
}

function checkSquareOf(fen: string): string | null {
  try {
    const c = new Chess(fen);
    if (!c.isCheck()) return null;
    const turn = c.turn();
    for (const row of c.board()) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === turn) return sq.square;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function formatEvalShort(cpWhite: number): string {
  if (Math.abs(cpWhite) >= 90000) {
    const mate = Math.ceil((100000 - Math.abs(cpWhite)) / 100);
    return `M${mate}`;
  }
  const pawns = cpWhite / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}
