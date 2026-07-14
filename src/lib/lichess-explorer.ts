// src/lib/lichess-explorer.ts
//
// Thin client for the public Lichess Opening Explorer API.
// Docs: https://lichess.org/api#tag/Opening-Explorer
// Important: the hostname is explorer.lichess.org (NOT lichess.org).
//
// Two sources are available:
//   - "masters": human master-level games (small, curated, very reliable)
//   - "lichess": all rated Lichess games (huge, filterable by rating/speed)
//
// No API key required. Be a good citizen: only one request at a time,
// and cache with Next's fetch revalidate so repeat visits are cheap.

export interface ExplorerMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating?: number;
}

export interface ExplorerTopGame {
  id: string;
  white: { name: string; rating: number };
  black: { name: string; rating: number };
  winner: "white" | "black" | null;
  year?: number;
}

export interface ExplorerResult {
  white: number;
  draws: number;
  black: number;
  moves: ExplorerMove[];
  topGames?: ExplorerTopGame[];
  opening?: { eco: string; name: string } | null;
}

export type ExplorerSource = "masters" | "lichess";

interface FetchExplorerOptions {
  source?: ExplorerSource;
  topGames?: number; // 0-4, only for "masters"
  moves?: number; // how many candidate next-moves to return, default 12
  /** Lichess-only: restrict to these rating brackets, e.g. [1600, 2000, 2500] */
  ratings?: number[];
  /** Lichess-only: restrict to these speeds, e.g. ["blitz", "rapid"] */
  speeds?: string[];
}

const BASE_URL = "https://explorer.lichess.org";

/**
 * Fetch aggregate stats (white/draw/black %, popular next moves, top games)
 * for a given FEN position.
 *
 * Returns null on any failure (network error, rate limit, bad FEN) so
 * callers can gracefully fall back to cached/sample data instead of
 * breaking the page.
 */
export async function fetchExplorerStats(
  fen: string,
  options: FetchExplorerOptions = {}
): Promise<ExplorerResult | null> {
  const { source = "masters", topGames = 4, moves = 12, ratings, speeds } = options;

  const params = new URLSearchParams({ fen, topGames: String(topGames), moves: String(moves) });
  if (source === "lichess") {
    if (ratings?.length) params.set("ratings", ratings.join(","));
    if (speeds?.length) params.set("speeds", speeds.join(","));
  }

  const url = `${BASE_URL}/${source}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      // Revalidate once a day — opening theory data doesn't change minute to minute.
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) {
      console.error("[lichess-explorer] request failed", res.status, url);
      return null;
    }
    return (await res.json()) as ExplorerResult;
  } catch (err) {
    console.error("[lichess-explorer] fetch threw", err, url);
    return null;
  }
}

/** Derived percentages, rounded, for display. */
export function explorerPercentages(result: ExplorerResult) {
  const total = result.white + result.draws + result.black;
  if (total === 0) return { whitePct: 0, drawPct: 0, blackPct: 0, totalGames: 0 };
  return {
    whitePct: Math.round((result.white / total) * 100),
    drawPct: Math.round((result.draws / total) * 100),
    blackPct: Math.round((result.black / total) * 100),
    totalGames: total,
  };
}
