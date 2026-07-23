"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import { GameReview } from "@/components/game-review";

interface ParsedHeaders {
  white: string;
  black: string;
  result: string | null;
}

function parseHeaders(pgn: string): ParsedHeaders | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const h = chess.header();
    return {
      white: h.White || "White",
      black: h.Black || "Black",
      result: h.Result && h.Result !== "*" ? h.Result : null,
    };
  } catch {
    return null;
  }
}

export default function ReviewPage() {
  const [pgnInput, setPgnInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<{ pgn: string; headers: ParsedHeaders } | null>(
    null,
  );
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");

  function startReview() {
    const trimmed = pgnInput.trim();
    const headers = parseHeaders(trimmed);
    if (!headers) {
      setError("Couldn't read that PGN — check it's a complete, valid game.");
      return;
    }
    setError(null);
    setReviewing({ pgn: trimmed, headers });
  }

  function newPgn() {
    setReviewing(null);
    setPgnInput("");
    setError(null);
  }

  if (reviewing) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-fg">
            {reviewing.headers.white} vs {reviewing.headers.black}
          </h1>
          <button
            onClick={newPgn}
            className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fg hover:border-line-strong"
          >
            Review a different PGN
          </button>
        </div>
        <GameReview
          pgn={reviewing.pgn}
          whiteName={reviewing.headers.white}
          blackName={reviewing.headers.black}
          playerColor={playerColor}
          result={reviewing.headers.result}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-fg">Review a PGN</h1>
      <p className="mb-6 text-sm text-muted">
        Paste the full PGN of any game — from any site, or from your own analysis — and get
        the same Stockfish engine review, move classifications, and accuracy stats as games
        pulled from Chess.com or Lichess.
      </p>

      <label className="mb-2 block text-sm text-faint">PGN</label>
      <textarea
        value={pgnInput}
        onChange={(e) => setPgnInput(e.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={'[White "Player1"]\n[Black "Player2"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 ...'}
        className="w-full resize-none rounded border border-line bg-panel p-3 font-mono text-sm text-fg"
      />
      {error && <p className="mt-2 text-sm text-rose">{error}</p>}

      <div className="mt-4">
        <p className="mb-2 text-sm text-faint">Review from whose perspective?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPlayerColor("white")}
            className={`rounded px-3 py-1.5 text-sm border ${
              playerColor === "white" ? "border-accent bg-accent/10 text-fg" : "border-line text-faint"
            }`}
          >
            White
          </button>
          <button
            onClick={() => setPlayerColor("black")}
            className={`rounded px-3 py-1.5 text-sm border ${
              playerColor === "black" ? "border-accent bg-accent/10 text-fg" : "border-line text-faint"
            }`}
          >
            Black
          </button>
        </div>
      </div>

      <button
        onClick={startReview}
        disabled={!pgnInput.trim()}
        className="mt-6 w-full rounded bg-fg py-3 text-sm font-medium text-bg disabled:opacity-50"
      >
        Review Game
      </button>
    </div>
  );
}
