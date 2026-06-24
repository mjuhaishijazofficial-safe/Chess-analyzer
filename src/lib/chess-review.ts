import type { PvLine } from "./engine";

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

export function accuracyFromDrop(dropPoints: number): number {
  const a = 103.1668 * Math.exp(-0.04354 * Math.max(0, dropPoints)) - 3.1669;
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
  /** mover-perspective cp of the best line at the position before the move */
  bestCpStm: number;
  /** mover-perspective cp of the 2nd-best line (null if unavailable) */
  secondCpStm: number | null;
  /** mover-perspective cp after the move that was actually played */
  moverAfterCp: number;
  legalCount: number;
  /** material the mover gave up over the next reply (pawns); >0 = sacrifice */
  sacrifice: number;
}

export interface ClassifyResult {
  classification: Classification;
  winDrop: number;
  accuracy: number;
  gapToSecond: number | null;
}

export function classifyMove(i: ClassifyInput): ClassifyResult {
  const winBefore = winPercent(i.bestCpStm);
  const winAfter = winPercent(i.moverAfterCp);
  const winDrop = Math.max(0, winBefore - winAfter);
  const accuracy = accuracyFromDrop(winDrop);
  const gapToSecond =
    i.secondCpStm != null ? winBefore - winPercent(i.secondCpStm) : null;

  let classification: Classification;

  if (i.legalCount <= 1) {
    classification = "forced";
  } else if (i.ply <= BOOK_PLIES && winDrop < 1.5) {
    // sound opening moves are treated as theory ("book"), as in chess.com
    classification = "book";
  } else if (i.bestUci && i.playedUci === i.bestUci) {
    const onlyMove = gapToSecond != null && gapToSecond >= 10;
    const stillOk = winAfter >= 50;
    const notTrivial = winBefore <= 97;
    if (i.sacrifice >= 2 && stillOk && notTrivial) {
      classification = "brilliant";
    } else if (onlyMove && notTrivial) {
      classification = "great";
    } else {
      classification = "best";
    }
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

  return { classification, winDrop, accuracy, gapToSecond };
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
