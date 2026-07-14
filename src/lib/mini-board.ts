// src/lib/mini-board.ts
//
// Produces the 8x8 board state (as unicode chess piece characters) for the
// FINAL position after a given SAN move string. Used for small static
// board previews on cards — not interactive, so no need to pull in the
// full OpeningBoardViewer here.

import { Chess } from "chess.js";

const WHITE_PIECES: Record<string, string> = {
  p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔",
};
const BLACK_PIECES: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
};

/** 8x8 grid, row 0 = rank 8 (black's back rank) down to row 7 = rank 1. */
export function miniBoardFromMoves(movesString: string): (string | null)[][] {
  const chess = new Chess();
  const tokens = movesString.trim().split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    try {
      chess.move(token);
    } catch {
      break;
    }
  }

  const board = chess.board(); // chess.js returns [rank8..rank1][fileA..fileH]
  return board.map((row) =>
    row.map((square) => {
      if (!square) return null;
      const table = square.color === "w" ? WHITE_PIECES : BLACK_PIECES;
      return table[square.type] ?? null;
    })
  );
}
