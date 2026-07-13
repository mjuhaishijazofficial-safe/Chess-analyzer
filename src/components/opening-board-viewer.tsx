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
    </div>
  );
}