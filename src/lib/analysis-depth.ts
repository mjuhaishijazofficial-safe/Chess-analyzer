"use client";

/**
 * User-selectable Stockfish analysis depth/speed tradeoff, used by both
 * the Game Review (per-move engine think time) and Puzzles (per-position
 * think time) features. Persisted in localStorage like the other
 * appearance/sound preferences.
 */

export type AnalysisDepth = "fast" | "balanced" | "deep";

export const ANALYSIS_DEPTHS: {
  value: AnalysisDepth;
  label: string;
  blurb: string;
}[] = [
  {
    value: "fast",
    label: "Fast",
    blurb: "Quickest review, slightly shallower engine reads.",
  },
  {
    value: "balanced",
    label: "Balanced",
    blurb: "Default — good accuracy without a long wait.",
  },
  {
    value: "deep",
    label: "Deep",
    blurb: "Strongest analysis Stockfish can give — reviews take longer.",
  },
];

const STORAGE_KEY = "chessbuddy-analysis-depth";

export function getAnalysisDepth(): AnalysisDepth {
  if (typeof window === "undefined") return "balanced";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "fast" || saved === "balanced" || saved === "deep"
    ? saved
    : "balanced";
}

export function setAnalysisDepth(depth: AnalysisDepth) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, depth);
}

/**
 * Per-move engine think time in milliseconds for the Game Review feature,
 * scaled by whether the multi-threaded (faster) Stockfish build loaded.
 */
export function reviewMovetimeFor(
  depth: AnalysisDepth,
  multiThreaded: boolean,
): number {
  const table: Record<AnalysisDepth, [multi: number, single: number]> = {
    fast: [150, 300],
    balanced: [300, 600],
    deep: [900, 1600],
  };
  const [multi, single] = table[depth];
  return multiThreaded ? multi : single;
}

/**
 * Per-position engine think time in milliseconds for the Puzzles feature
 * (a single position gets more time than a per-move game review pass).
 */
export function puzzleMovetimeFor(
  depth: AnalysisDepth,
  multiThreaded: boolean,
): number {
  const table: Record<AnalysisDepth, [multi: number, single: number]> = {
    fast: [700, 1100],
    balanced: [1200, 2000],
    deep: [2500, 4000],
  };
  const [multi, single] = table[depth];
  return multiThreaded ? multi : single;
}
