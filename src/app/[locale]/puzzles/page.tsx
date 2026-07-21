"use client";
import { coachReview } from "@/lib/coach";
import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "@/components/board";
import { getPuzzles, deletePuzzle, type Puzzle } from "@/lib/puzzle-store";
import { Engine } from "@/lib/engine";
import { classifyMove, material, cpStm, CLASS_META, type Classification } from "@/lib/chess-review";
import { playSoundForSan } from "@/lib/sound";
import { getAnalysisDepth, puzzleMovetimeFor } from "@/lib/analysis-depth";

interface Base {
  bestUci: string;
  bestCp: number;
  secondCp: number | null;
  legalCount: number;
}

export default function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [current, setCurrent] = useState(0);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [selected, setSelected] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [displayFen, setDisplayFen] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [lastResult, setLastResult] = useState<{ cls: Classification; sanPlayed: string; bestSan: string; message: string } | null>(null);

  const engineRef = useRef<Engine | null>(null);
  const baseRef = useRef<Base | null>(null);

  useEffect(() => {
    setPuzzles(getPuzzles());
  }, []);

  const puzzle = puzzles[current] ?? null;

  async function analyzePosition(fen: string): Promise<Base> {
    const engine = engineRef.current!;
    const movetime = puzzleMovetimeFor(getAnalysisDepth(), engine.multiThreaded);
    const ev = await engine.analyze(fen, { movetime, depth: 22 });
    const c = new Chess(fen);
    return {
      bestUci: ev.bestMove ?? ev.lines[0]?.move ?? "",
      bestCp: cpStm(ev.lines[0]),
      secondCp: ev.lines[1] ? cpStm(ev.lines[1]) : null,
      legalCount: c.moves().length,
    };
  }

  useEffect(() => {
    if (!puzzle) return;
    setDisplayFen(puzzle.fen);
    setSelected(null);
    setLegalTargets([]);
    setLastMove(null);
    setLastResult(null);
    baseRef.current = null;
    const c = new Chess(puzzle.fen);
    setOrientation(c.turn() === "w" ? "white" : "black");

    const engine = new Engine();
    engineRef.current = engine;
    setThinking(true);
    engine.whenReady.then(async () => {
      baseRef.current = await analyzePosition(puzzle.fen);
      setThinking(false);
    });

    return () => {
      engine.destroy();
    };
  }, [puzzle]);

  async function handleSquareClick(square: string) {
    if (!puzzle || !displayFen || thinking || !engineRef.current) return;
    const c = new Chess(displayFen);

    if (!selected) {
      const piece = c.get(square as never);
      if (piece && piece.color === c.turn()) {
        setSelected(square);
        const moves = c.moves({ square: square as never, verbose: true }) as { to: string }[];
        setLegalTargets(moves.map((m) => m.to));
      }
      return;
    }
    if (selected === square) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    const piece = c.get(selected as never);
    const isPromo = piece?.type === "p" && (square[1] === "8" || square[1] === "1");

    let mv;
    try {
      mv = c.move({ from: selected, to: square, promotion: isPromo ? "q" : undefined });
    } catch {
      setSelected(null);
      setLegalTargets([]);
      return;
    }
    if (!mv) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    const base = baseRef.current;
    setSelected(null);
    setLegalTargets([]);
    setLastMove({ from: mv.from, to: mv.to });
    setDisplayFen(c.fen());
    playSoundForSan(mv.san);

    if (!base) return;

    setThinking(true);
    const uci = `${mv.from}${mv.to}${mv.promotion ?? ""}`;
    const fenAfter = c.fen();
    const nextBase = await analyzePosition(fenAfter);
    const evAfterStm = nextBase.bestCp;
    const moverAfterCpFixed = -evAfterStm;

    const moverColor = mv.color;
    const matBeforeMove = material(displayFen, moverColor);
    let matAfter = material(fenAfter, moverColor);
    if (nextBase.bestUci) {
      try {
        const c2 = new Chess(fenAfter);
        c2.move({
          from: nextBase.bestUci.slice(0, 2),
          to: nextBase.bestUci.slice(2, 4),
          promotion: nextBase.bestUci.length > 4 ? nextBase.bestUci[4] : undefined,
        });
        matAfter = material(c2.fen(), moverColor);
      } catch {
        /* keep */
      }
    }
    const sacrifice = matBeforeMove - matAfter;

    const res = classifyMove({
      ply: 9999,
      playedUci: uci,
      bestUci: base.bestUci,
      bestCpStm: base.bestCp,
      secondCpStm: base.secondCp,
      moverAfterCp: moverAfterCpFixed,
      legalCount: base.legalCount,
      sacrifice,
      bookMatchPlies: 0,
    });

    const bestSan = sanFromUci(displayFen, base.bestUci);
    const coach = coachReview({
      ply: 1,
      san: mv.san,
      classification: res.classification,
      isPlayer: true,
      bestSan: bestSan,
      played: null,
      best: null,
      reply: null,
    });
    setLastResult({
      cls: res.classification,
      sanPlayed: mv.san,
      bestSan: bestSan ?? base.bestUci,
      message: coach.message,
    });
    baseRef.current = nextBase;
    setThinking(false);
  }

  function next() {
    setCurrent((c) => Math.min(c + 1, puzzles.length - 1));
  }

  function resetPosition() {
    if (!puzzle) return;
    setDisplayFen(puzzle.fen);
    setSelected(null);
    setLegalTargets([]);
    setLastMove(null);
    setLastResult(null);
    baseRef.current = null;
    setThinking(true);
    engineRef.current?.whenReady.then(async () => {
      baseRef.current = await analyzePosition(puzzle.fen);
      setThinking(false);
    });
  }

  function removePuzzle() {
    if (!puzzle) return;
    deletePuzzle(puzzle.id);
    const updated = getPuzzles();
    setPuzzles(updated);
    setCurrent((c) => Math.min(c, Math.max(0, updated.length - 1)));
  }

  if (puzzles.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold text-fg">My Puzzles</h1>
        <p className="text-muted">
          No puzzles saved yet. Go to any Game Review and click &quot;Save as
          Puzzle&quot; on a mistake or blunder.
        </p>
      </div>
    );
  }

  if (!puzzle || !displayFen) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold text-fg">My Puzzles</h1>
      <p className="mb-4 text-sm text-muted">
        Puzzle {current + 1} of {puzzles.length} — play any move, Stockfish judges each one.
      </p>

      <p className="mb-3 text-sm text-muted">
        You were playing{" "}
        <span className="font-medium text-fg">
          {puzzle.userColor === "w" ? "White" : "Black"}
        </span>{" "}
        against{" "}
        <span className="font-medium text-fg">
          {puzzle.userColor === "w" ? puzzle.blackName : puzzle.whiteName}
        </span>
        .
      </p>

      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
          className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs text-fg"
        >
          ⇅ Flip Board
        </button>
      </div>

      <Board
        key={puzzle.id}
        fen={displayFen}
        orientation={orientation}
        lastMove={lastMove}
        selectedSquare={selected}
        legalMoves={legalTargets}
        onSquareClick={handleSquareClick}
      />

      <div className="mt-4">
        {thinking && <span className="text-sm text-muted">Stockfish is thinking…</span>}

        {!thinking && !lastResult && (
          <span className="text-sm text-muted">Click a piece, then click where to move it.</span>
        )}

        {lastResult && !thinking && (
          <div className="panel rounded-xl p-3">
            <div className={`text-sm font-semibold ${CLASS_META[lastResult.cls].text}`}>
              {lastResult.sanPlayed}: {CLASS_META[lastResult.cls].symbol} {CLASS_META[lastResult.cls].label}
              {lastResult.cls !== "best" && lastResult.cls !== "brilliant" && ` (engine liked ${lastResult.bestSan})`}
            </div>
            <p className="mt-1 text-sm text-muted">{lastResult.message}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={resetPosition}
          className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fg"
        >
          Reset Position
        </button>
        <button
          onClick={next}
          disabled={current >= puzzles.length - 1}
          className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fg disabled:opacity-40"
        >
          Next puzzle
        </button>
        <button
          onClick={removePuzzle}
          className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-rose"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function sanFromUci(fen: string, uci: string): string | null {
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