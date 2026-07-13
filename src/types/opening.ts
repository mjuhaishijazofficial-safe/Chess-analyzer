// src/types/opening.ts
// Core data model for the Opening Explorer feature.
// Extend this as later features (move tree, engine analysis, practice) are added.

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface OpeningSummary {
  id: string;
  name: string;
  eco: string;               // e.g. "C50"
  moves: string;             // SAN move string, e.g. "e4 e5 Nf3 Nc6"
  category: string;          // e.g. "King's Pawn", "Sicilian"
  difficulty: Difficulty;
  popularity: number;        // 0-100, share of games at this position
  winRateWhite: number;      // 0-100
  drawRate: number;          // 0-100
  trending?: boolean;
  variations?: { name: string; moves: string }[];
}

export interface SearchMatch extends OpeningSummary {
  matchType: "name" | "eco" | "moves";
  matchedText: string;       // the substring that matched, for highlighting
}
