// src/lib/opening-search.ts
// Pure search logic for the Opening Explorer search bar.
// Detects whether the query looks like an ECO code, a move string, or a
// plain name, and ranks matches accordingly. No React/UI here on purpose.

import type { OpeningSummary, SearchMatch } from "@/types/opening";

const ECO_PATTERN = /^[a-e]\d{0,2}$/i;
const MOVE_TOKEN_PATTERN = /^[a-h1-8nbrqkoNBRQKO0-9x+#=-]+$/;

export type QueryKind = "eco" | "moves" | "name";

export function detectQueryKind(query: string): QueryKind {
  const trimmed = query.trim();
  if (!trimmed) return "name";
  if (ECO_PATTERN.test(trimmed)) return "eco";

  const tokens = trimmed.split(/\s+/);
  if (tokens.length > 1 && tokens.every((t) => MOVE_TOKEN_PATTERN.test(t))) {
    return "moves";
  }
  return "name";
}

export function searchOpenings(
  query: string,
  dataset: OpeningSummary[],
  limit = 8
): SearchMatch[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const kind = detectQueryKind(trimmed);
  const lower = trimmed.toLowerCase();
  const results: SearchMatch[] = [];

  for (const opening of dataset) {
    if (kind === "eco" && opening.eco.toLowerCase().startsWith(lower)) {
      results.push({ ...opening, matchType: "eco", matchedText: opening.eco });
      continue;
    }

    if (kind === "moves" && opening.moves.toLowerCase().startsWith(lower)) {
      results.push({ ...opening, matchType: "moves", matchedText: opening.moves });
      continue;
    }

    if (kind === "name" && opening.name.toLowerCase().includes(lower)) {
      results.push({ ...opening, matchType: "name", matchedText: opening.name });
    }
  }

  // Highest popularity first so common openings surface before rare sidelines.
  return results.sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}