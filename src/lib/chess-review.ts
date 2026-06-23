import type { EngineLine } from "./engine";

export type Classification =
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "forced"
  | "book";

export interface ClassMeta {
  label: string;
  symbol: string;
  text: string; // tailwind text color class
  chip: string; // tailwind bg/border classes
  blurb: string;
}

export const CLASS_META: Record<Classification, ClassMeta> = {
  best: {
    label: "Best",
    symbol: "★",
    text: "text-accent",
    chip: "bg-accent/10 border-accent/30",
    blurb: "The engine's top choice — you found the strongest move.",
  },
  excellent: {
    label: "Excellent",
    symbol: "✓",
    text: "text-accent",
    chip: "bg-accent/10 border-accent/30",
    blurb: "Practically perfect — barely any loss versus the best move.",
  },
  good: {
    label: "Good",
    symbol: "✓",
    text: "text-cyan",
    chip: "bg-cyan/10 border-cyan/30",
    blurb: "A solid, reasonable move that keeps your position healthy.",
  },
  inaccuracy: {
    label: "Inaccuracy",
    symbol: "?!",
    text: "text-amber",
    chip: "bg-amber/10 border-amber/30",
    blurb: "Slightly imprecise — there was a clearly better option.",
  },
  mistake: {
    label: "Mistake",
    symbol: "?",
    text: "text-[#fb923c]",
    chip: "bg-[#fb923c]/10 border-[#fb923c]/30",
    blurb: "This noticeably hurt your position. Worth understanding why.",
  },
  blunder: {
    label: "Blunder",
    symbol: "??",
    text: "text-rose",
    chip: "bg-rose/10 border-rose/30",
    blurb: "A serious error that swung the evaluation against you.",
  },
  forced: {
    label: "Forced",
    symbol: "□",
    text: "text-muted",
    chip: "bg-panel-2 border-line",
    blurb: "The only legal move — nothing to decide here.",
  },
  book: {
    label: "Book",
    symbol: "📖",
    text: "text-muted",
    chip: "bg-panel-2 border-line",
    blurb: "A known opening move from established theory.",
  },
};

/* ---------------------------- Eval math --------------------------- */

/** Map a forced mate distance to a large signed centipawn value. */
export function mateToCp(mate: number): number {
  const sign = mate >= 0 ? 1 : -1;
  return sign * (100000 - Math.min(Math.abs(mate), 100) * 100);
}

/** Centipawns from the side-to-move's perspective for an engine line. */
export function lineToCpStm(line: EngineLine): number {
  if (line.mate != null) return mateToCp(line.mate);
  return line.scoreCp ?? 0;
}

/** Centipawns from White's perspective (for the eval bar / display). */
export function lineToCpWhite(line: EngineLine, whiteToMove: boolean): number {
  const stm = lineToCpStm(line);
  return whiteToMove ? stm : -stm;
}

/**
 * Win probability (0–100) for the side to move, given centipawns from that
 * side's perspective. Logistic curve used by Lichess/chess.com-style reviews.
 */
export function winPercent(cpStm: number): number {
  const v = 2 / (1 + Math.exp(-0.00368208 * cpStm)) - 1;
  return Math.max(0, Math.min(100, 50 + 50 * v));
}

/** Per-move accuracy (0–100) from the drop in win% (in percentage points). */
export function accuracyFromDrop(dropPoints: number): number {
  const a = 103.1668 * Math.exp(-0.04354 * Math.max(0, dropPoints)) - 3.1669;
  return Math.max(0, Math.min(100, a));
}

export interface ClassifyInput {
  playedUci: string;
  bestUci: string | null;
  /** mover's win% with best play (before the move) */
  winBefore: number;
  /** mover's win% after the move actually played */
  winAfter: number;
  legalCount: number;
}

export function classifyMove(input: ClassifyInput): {
  classification: Classification;
  winDrop: number;
  accuracy: number;
} {
  const winDrop = Math.max(0, input.winBefore - input.winAfter);
  const accuracy = accuracyFromDrop(winDrop);

  let classification: Classification;
  if (input.legalCount <= 1) {
    classification = "forced";
  } else if (input.bestUci && input.playedUci === input.bestUci) {
    classification = "best";
  } else if (winDrop < 2) {
    classification = "excellent";
  } else if (winDrop < 5) {
    classification = "good";
  } else if (winDrop < 10) {
    classification = "inaccuracy";
  } else if (winDrop < 20) {
    classification = "mistake";
  } else {
    classification = "blunder";
  }

  return { classification, winDrop, accuracy };
}

/* ---------------------------- Per-move ---------------------------- */

export interface MoveReview {
  ply: number; // 1-based
  moveNo: number; // full move number
  color: "w" | "b";
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  /** eval bar value at this node (after the move), White's perspective, cp */
  evalWhiteCp: number | null;
  bestUci: string | null;
  bestSan: string | null;
  classification: Classification | null;
  winDrop: number | null;
  accuracy: number | null;
  analyzed: boolean;
}

/* ---------------------------- Summary ----------------------------- */

export interface SideSummary {
  accuracy: number | null;
  counts: Record<Classification, number>;
}

export interface ReviewSummary {
  white: SideSummary;
  black: SideSummary;
}

function emptyCounts(): Record<Classification, number> {
  return {
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    forced: 0,
    book: 0,
  };
}

export function summarize(moves: MoveReview[]): ReviewSummary {
  const sides = {
    w: { sum: 0, n: 0, counts: emptyCounts() },
    b: { sum: 0, n: 0, counts: emptyCounts() },
  };

  for (const m of moves) {
    if (!m.analyzed || m.classification == null) continue;
    const s = sides[m.color];
    s.counts[m.classification]++;
    if (m.accuracy != null) {
      s.sum += m.accuracy;
      s.n++;
    }
  }

  return {
    white: {
      accuracy: sides.w.n ? round1(sides.w.sum / sides.w.n) : null,
      counts: sides.w.counts,
    },
    black: {
      accuracy: sides.b.n ? round1(sides.b.sum / sides.b.n) : null,
      counts: sides.b.counts,
    },
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
