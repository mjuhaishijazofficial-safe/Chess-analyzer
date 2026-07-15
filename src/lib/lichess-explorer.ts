/**
 * Client for Lichess's public Opening Explorer API.
 * Docs: https://lichess.org/api#tag/Opening-Explorer
 *
 * No API key required. Used by the Opening Detail page to show real
 * win/draw/loss stats and notable games for a given position, pulled from
 * either the masters database or Lichess's own player games.
 */

const EXPLORER_BASE = "https://explorer.lichess.ovh";

export interface ExplorerTopGame {
  id: string;
  winner: "white" | "black" | null;
  white: { name: string; rating: number };
  black: { name: string; rating: number };
  year?: number;
}

export interface ExplorerStats {
  white: number;
  draws: number;
  black: number;
  topGames: ExplorerTopGame[];
}

export interface ExplorerPercentages {
  whitePct: number;
  drawPct: number;
  totalGames: number;
}

export interface FetchExplorerOptions {
  /** "masters" = historical master games, "lichess" = Lichess player games. */
  source?: "masters" | "lichess";
  topGames?: number;
}

interface RawExplorerGame {
  id?: string;
  winner?: "white" | "black" | null;
  white?: { name?: string; rating?: number };
  black?: { name?: string; rating?: number };
  year?: number;
}

interface RawExplorerResponse {
  white?: number;
  draws?: number;
  black?: number;
  topGames?: RawExplorerGame[];
}

/**
 * Fetches aggregate win/draw/loss stats (and a few notable games) for a
 * given position. Returns null on any network/parsing failure so callers
 * can fall back to their own estimated numbers instead of crashing.
 */
export async function fetchExplorerStats(
  fen: string,
  options: FetchExplorerOptions = {},
): Promise<ExplorerStats | null> {
  const { source = "masters", topGames = 3 } = options;
  const params = new URLSearchParams({ fen, topGames: String(topGames) });

  try {
    const res = await fetch(`${EXPLORER_BASE}/${source}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data: RawExplorerResponse = await res.json();
    return {
      white: data.white ?? 0,
      draws: data.draws ?? 0,
      black: data.black ?? 0,
      topGames: (data.topGames ?? []).map((g) => ({
        id: g.id ?? "",
        winner: g.winner ?? null,
        white: { name: g.white?.name ?? "White", rating: g.white?.rating ?? 0 },
        black: { name: g.black?.name ?? "Black", rating: g.black?.rating ?? 0 },
        year: g.year,
      })),
    };
  } catch (err) {
    console.error("[lichess-explorer] fetch failed:", err);
    return null;
  }
}

/**
 * Converts raw game counts into percentages. Returns 0/0/0 (not NaN) when
 * there's no data at all, so callers can safely check `totalGames > 0`
 * before trusting the split.
 */
export function explorerPercentages(stats: ExplorerStats): ExplorerPercentages {
  const total = stats.white + stats.draws + stats.black;
  if (total === 0) {
    return { whitePct: 0, drawPct: 0, totalGames: 0 };
  }
  return {
    whitePct: Math.round((stats.white / total) * 100),
    drawPct: Math.round((stats.draws / total) * 100),
    totalGames: total,
  };
}
