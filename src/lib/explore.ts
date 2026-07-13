"use client";

import { Chess } from "chess.js";
import { Engine } from "./engine";
import { cpStm, type Classification } from "./chess-review";
import { coachReview, detectMotifs } from "./coach";

export interface ExploreResult {
  san: string;
  title: string;
  message: string;
  classification: Classification;
  cpl: number;
  bestSan: string | null;
}

/**
 * "Why not X?" — evaluate a single candidate move the user clicked on the
 * board (not necessarily the move that was actually played) and generate
 * the same kind of coach commentary the main game review uses. Runs the
 * engine twice: once on the position to find the best move, once on the
 * resulting position to see how good the clicked move actually was.
 */
export async function explainMove(
  engine: Engine,
  fen: string,
  uci: string,
  ply: number,
): Promise<ExploreResult | null> {
  const board = new Chess(fen);
  let mv;
  try {
    mv = board.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
  } catch {
    return null;
  }
  if (!mv) return null;
  const afterFen = board.fen();

  const before = await engine.analyze(fen, { depth: 14 });
  const bestCpStm = cpStm(before.lines[0]);
  const bestUci = before.bestMove ?? before.lines[0]?.move ?? null;
  const bestSan = bestUci ? uciToSan(fen, bestUci) : null;

  const after = await engine.analyze(afterFen, { depth: 14 });
  const moverAfterCp = -cpStm(after.lines[0]);

  const cpl = Math.max(0, bestCpStm - moverAfterCp);
  const isBest = !!bestUci && uci === bestUci;
  const classification = classifyCpl(cpl, isBest);

  const playedMotifs = detectMotifs(fen, uci);
  const bestMotifs = bestUci ? detectMotifs(fen, bestUci) : null;

  const coach = coachReview({
    ply,
    san: mv.san,
    classification,
    isPlayer: true,
    bestSan,
    played: playedMotifs,
    best: bestMotifs,
    reply: null,
  });

  return {
    san: mv.san,
    title: coach.title,
    message: coach.message,
    classification,
    cpl,
    bestSan,
  };
}

function classifyCpl(cpl: number, isBest: boolean): Classification {
  if (isBest) return "best";
  if (cpl <= 10) return "excellent";
  if (cpl <= 30) return "excellent";
  if (cpl <= 70) return "good";
  if (cpl <= 150) return "inaccuracy";
  if (cpl <= 300) return "mistake";
  return "blunder";
}

function uciToSan(fen: string, uci: string): string | null {
  try {
    const c = new Chess(fen);
    const mv = c.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return mv?.san ?? null;
  } catch {
    return null;
  }
}

/** Legal destination squares for the piece on `square`, or [] if none/empty. */
export function legalTargetsFrom(fen: string, square: string): string[] {
  try {
    const c = new Chess(fen);
    return c
      .moves({ square: square as never, verbose: true })
      .map((m) => m.to);
  } catch {
    return [];
  }
}

/** Full UCI (with promotion letter if needed) for a from→to pair. */
export function toUci(fen: string, from: string, to: string): string | null {
  try {
    const c = new Chess(fen);
    const options = c.moves({ square: from as never, verbose: true });
    const match = options.find((m) => m.to === to);
    if (!match) return null;
    return `${from}${to}${match.promotion ? "q" : ""}`;
  } catch {
    return null;
  }
}
