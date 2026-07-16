export interface Puzzle {
  id: string;
  fen: string;
  bestMove: string;
  bestMoveSan: string;
  playerMove: string;
  playerMoveSan: string;
  classification: string;
  whiteName: string;
  blackName: string;
  /** Which side the puzzle-saver was playing in the original game. */
  userColor: "w" | "b";
  savedAt: number;
}

const STORAGE_KEY = "chessbuddy-puzzles";

export function getPuzzles(): Puzzle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePuzzle(puzzle: Puzzle) {
  const puzzles = getPuzzles();
  puzzles.unshift(puzzle);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
}

export function deletePuzzle(id: string) {
  const puzzles = getPuzzles().filter((p) => p.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
}