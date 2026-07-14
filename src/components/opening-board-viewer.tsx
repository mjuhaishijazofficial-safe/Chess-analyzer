"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "@/components/board";

interface OpeningBoardViewerProps {
  moves: string; // SAN string, e.g. "e4 c5 Nf3 d6"
}

export function OpeningBoardViewer({ moves }: OpeningBoardViewerProps) {
  const steps = useMemo(() => {
    const chess = new Chess();
    const tokens = moves.trim().split(/\s+/).filter(Boolean);
    const result: { san: string; fen: string; from: string; to: string }[] = [
      { san: "Start", fen: chess.fen(), from: "", to: "" },
    ];
    for (const token of tokens) {
      const move = chess.move(token);
      if (!move) break;
      result.push({ san: move.san, fen: chess.fen(), from: move.from, to: move.to });
    }
    return result;
  }, [moves]);

  const [index, setIndex] = useState(0);
  const current = steps[index];
  const lastMove =
    index > 0 ? { from: current.from, to: current.to } : null;

  function goBack() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function goForward() {
    setIndex((i) => Math.min(steps.length - 1, i + 1));
  }

  // Group the move list into move-number pairs for display, e.g.
  // "1. e4 c5", "2. Nf3 d6" — steps[0] is the synthetic "Start" entry so
  // real moves start at steps[1].
  const movePairs: { number: number; whiteStepIndex: number; blackStepIndex: number | null }[] = [];
  for (let i = 1; i < steps.length; i += 2) {
    movePairs.push({
      number: Math.ceil(i / 2),
      whiteStepIndex: i,
      blackStepIndex: i + 1 < steps.length ? i + 1 : null,
    });
  }

  return (
    <div className="max-w-sm">
      <Board fen={current.fen} lastMove={lastMove} />

      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={goBack}
          disabled={index === 0}
          className="px-3 py-1.5 rounded-md border border-white/10 text-sm disabled:opacity-30"
        >
          ← Back
        </button>
        <span className="text-sm opacity-70">
          {index === 0 ? "Start" : `Move ${index}: ${current.san}`}
        </span>
        <button
          type="button"
          onClick={goForward}
          disabled={index === steps.length - 1}
          className="px-3 py-1.5 rounded-md border border-white/10 text-sm disabled:opacity-30"
        >
          Forward →
        </button>
      </div>

      {/* Interactive move list — click any move to jump the board there instantly. */}
      <div className="mt-4 flex flex-wrap gap-x-1 gap-y-1.5 text-sm">
        <button
          type="button"
          onClick={() => setIndex(0)}
          className={`px-2 py-0.5 rounded ${
            index === 0 ? "bg-white/15 font-medium" : "opacity-60 hover:opacity-100"
          }`}
        >
          Start
        </button>
        {movePairs.map((pair) => (
          <span key={pair.number} className="flex items-center gap-1">
            <span className="opacity-40 font-mono text-xs">{pair.number}.</span>
            <button
              type="button"
              onClick={() => setIndex(pair.whiteStepIndex)}
              className={`px-2 py-0.5 rounded ${
                index === pair.whiteStepIndex ? "bg-white/15 font-medium" : "opacity-80 hover:opacity-100"
              }`}
            >
              {steps[pair.whiteStepIndex].san}
            </button>
            {pair.blackStepIndex !== null && (
              <button
                type="button"
                onClick={() => setIndex(pair.blackStepIndex!)}
                className={`px-2 py-0.5 rounded ${
                  index === pair.blackStepIndex ? "bg-white/15 font-medium" : "opacity-80 hover:opacity-100"
                }`}
              >
                {steps[pair.blackStepIndex].san}
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
