// src/lib/moves-to-fen.ts
//
// Converts a space-separated SAN move string (e.g. "e4 e5 Nf3 Nc6")
// into the resulting FEN, using chess.js (already used by the Game
// Review feature). This is what lets us query the Lichess Opening
// Explorer for a specific opening line's real-game statistics.

import { Chess } from "chess.js";

/**
 * Returns the FEN after playing the given SAN moves from the start
 * position. Stops early (returns the FEN reached so far) if a move
 * fails to parse, rather than throwing — opening data is sometimes
 * hand-typed and a single typo shouldn't break the whole page.
 */
export function fenAfterMoves(movesString: string): string {
  const chess = new Chess();
  const tokens = movesString.trim().split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    try {
      chess.move(token);
    } catch {
      break;
    }
  }

  return chess.fen();
}

/** Standard starting position FEN, useful as a fallback/default. */
export const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
