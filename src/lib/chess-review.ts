import type { PvLine } from "./engine";
import { bookPlies } from "./opening-book";


export type Classification =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "miss"
  | "mistake"
  | "blunder"
  | "forced";

export interface ClassMeta {
  label: string;
  symbol: string;
  text: string;
  chip: string;
  blurb: string;
}

export const CLASS_META: Record<Classification, ClassMeta> = {
  brilliant: {
    label: "Brilliant",
    symbol: "!!",
    text: "text-cyan",
    chip: "bg-cyan/10 border-cyan/30",
    blurb: "A stunning move — a sound sacrifice that keeps you on top.",
  },
  great: {
    label: "Great move",
    symbol: "!",
    text: "text-[#5b9bd5]",
    chip: "bg-[#5b9bd5]/10 border-[#5b9bd5]/30",
    blurb: "The only move that holds your position together — well spotted.",
  },
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
    text: "text-[#9bbf6a]",
    chip: "bg-[#9bbf6a]/10 border-[#9bbf6a]/30",
    blurb: "A solid, reasonable move that keeps your position healthy.",
  },
  book: {
    label: "Book",
    symbol: "📖",
    text: "text-muted",
    chip: "bg-panel-2 border-line",
    blurb: "A well-known opening move from established theory.",
  },
  inaccuracy: {
    label: "Inaccuracy",
    symbol: "?!",
    text: "text-amber",
    chip: "bg-amber/10 border-amber/30",
    blurb: "Slightly imprecise — there was a clearly better option.",
  },
  miss: {
    label: "Miss",
    symbol: "✗",
    text: "text-rose",
    chip: "bg-rose/10 border-rose/30",
    blurb: "A missed chance — a much stronger move was on the table.",
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
};

/* ---------------------------- Eval math --------------------------- */

export function mateToCp(mate: number): number {
  const sign = mate >= 0 ? 1 : -1;
  return sign * (100000 - Math.min(Math.abs(mate), 100) * 100);
}

/** Centipawns from the side-to-move's perspective for a PV line. */
export function cpStm(line: PvLine | undefined): number {
  if (!line) return 0;
  if (line.mate != null) return mateToCp(line.mate);
  return line.scoreCp ?? 0;
}

/** Centipawns from White's perspective for the eval bar. */
export function cpWhite(line: PvLine | undefined, whiteToMove: boolean): number {
  const stm = cpStm(line);
  return whiteToMove ? stm : -stm;
}

/** Win probability (0–100) for the side to move, given its-perspective cp. */
export function winPercent(cp: number): number {
  const v = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
  return Math.max(0, Math.min(100, 50 + 50 * v));
}

export function accuracyFromCPL(cpl: number, k = 0.008): number {
  const clamped = Math.max(0, cpl);
  const a = 100 * Math.exp(-k * clamped);
  return Math.max(0, Math.min(100, a));
}

/* --------------------------- Material ----------------------------- */

const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/** Total material for one color from a FEN placement field. */
export function material(fen: string, color: "w" | "b"): number {
  const placement = fen.split(" ")[0];
  let sum = 0;
  for (const ch of placement) {
    if (!/[a-zA-Z]/.test(ch)) continue;
    const isWhite = ch === ch.toUpperCase();
    if ((color === "w") === isWhite) sum += PIECE_VALUE[ch.toLowerCase()] ?? 0;
  }
  return sum;
}

/* ------------------------- Classification ------------------------- */

const BOOK_PLIES = 10;

export interface ClassifyInput {
  ply: number;
  playedUci: string;
  bestUci: string | null;
  bestCpStm: number;
  secondCpStm: number | null;
  moverAfterCp: number;
  legalCount: number;
  sacrifice: number;
  bookMatchPlies: number;
}

export interface ClassifyResult {
  classification: Classification;
  winDrop: number;
  accuracy: number;
  gapToSecond: number | null;
}

export function classifyMove(i: ClassifyInput): ClassifyResult {
  // Centipawn Loss: kitna eval gira best move ke muqable
  const cpl = Math.max(0, i.bestCpStm - i.moverAfterCp);
  const accuracy = accuracyFromCPL(cpl);
  const gapToSecond =
    i.secondCpStm != null ? i.bestCpStm - i.secondCpStm : null;

  let classification: Classification;

  const isTopChoice = i.bestUci != null && i.playedUci === i.bestUci;

  // Position abhi bhi safe hai? (winning ya draw jaisa, na ke haar rahe ho)
  const positionSafe = i.moverAfterCp >= -20;

  if (i.legalCount <= 1) {
    classification = "forced";
  } else if (i.ply <= i.bookMatchPlies) {
    classification = "book";
 } else if (isTopChoice) {
  const onlyMove = gapToSecond != null && gapToSecond >= 250;

    // Brilliant: bara sacrifice + position clearly winning + move surprising
    const bigSacrifice = i.sacrifice >= 3;
    const clearlyWinning = i.moverAfterCp >= 0;
    const isSurprising = gapToSecond != null && gapToSecond >= 150;

    if (bigSacrifice && clearlyWinning && isSurprising) {
      classification = "brilliant";
    } else if (onlyMove) {
      classification = "great";
    } else {
      classification = "best";
    }
  } else if (cpl <= 10) {
    classification = "excellent";
  } else if (cpl <= 30) {
    classification = "excellent";
  } else if (cpl <= 70) {
    classification = "good";
  } else if (cpl <= 150) {
    classification = "inaccuracy";
  } else if (cpl <= 300) {
    classification = "mistake";
  } else {
    classification = "blunder";
  }

  return { classification, winDrop: cpl, accuracy, gapToSecond };
}

/* ----------------------------- Move ------------------------------- */

export interface MoveReview {
  ply: number;
  moveNo: number;
  color: "w" | "b";
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  evalWhiteCp: number | null;
  bestUci: string | null;
  bestSan: string | null;
  bestLineSan: string[];
  classification: Classification | null;
  winDrop: number | null;
  accuracy: number | null;
  coachTitle: string | null;
  coachMessage: string | null;
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
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    miss: 0,
    mistake: 0,
    blunder: 0,
    forced: 0,
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
