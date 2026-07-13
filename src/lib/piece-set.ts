export const PIECE_SETS = [
  "cburnett",
  "alpha",
  "merida",
  "pirouetti",
  "chessnut",
  "companion",
  "fantasy",
  "spatial",
] as const;

export type PieceSet = (typeof PIECE_SETS)[number];

const STORAGE_KEY = "chessbuddy-piece-set";

export function getPieceSet(): PieceSet {
  if (typeof window === "undefined") return "cburnett";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return (PIECE_SETS as readonly string[]).includes(saved ?? "")
    ? (saved as PieceSet)
    : "cburnett";
}

export function setPieceSet(set: PieceSet) {
  window.localStorage.setItem(STORAGE_KEY, set);
}