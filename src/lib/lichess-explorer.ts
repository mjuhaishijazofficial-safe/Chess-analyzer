/**
 * Thin client for the Lichess Opening Explorer public API.
 * Docs: https://lichess.org/api#tag/Opening-Explorer
 *
 * We only use the /masters endpoint (real over-the-board master games),
 * which needs no API key. Requests run server-side, so no CORS issues.
 *
 * The explorer occasionally rate-limits (429) or has outages — every
 * function here returns null on failure instead of throwing, so callers
 * (like the opening detail page) can fall back to estimated data.
 */

const EXPLORER_BASE = "https://explorer.lichess.ovh";

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "User-Agent": "chessbuddy/1.0 (Next.js analytics demo; +https://github.com/chessbuddy)",
    Accept: "application/json",
  };
  // As of March 2026, Lichess requires the opening explorer API to be
  // authenticated (previously-public anonymous access was removed after
  // DDoS abuse). A personal access token is enough — no special OAuth
  // scope is needed for these read-only public endpoints.
  const token = process.env.LICHESS_API_TOKEN;
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
export type ExplorerSource = "masters" | "lichess";

export interface ExplorerGameRef {
  id: string;
  winner?: "white" | "black";
  white: { name: string; rating: number };
  black: { name: string; rating: number };
  year?: number;
}

export interface ExplorerMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating?: number;
}

export interface ExplorerStats {
  white: number;
  draws: number;
  black: number;
  moves: ExplorerMove[];
  topGames: ExplorerGameRef[];
}

export interface FetchExplorerOptions {
  source?: ExplorerSource;
  topGames?: number; // how many top games to request (0-15)
  play?: string[]; // extra UCI moves to play from fen, if needed
}

/**
 * Fetch aggregate stats (white/draws/black + top games) for a position.
 * Returns null if the position isn't found, the request fails, or the
 * explorer is rate-limiting/down — never throws.
 */
export async function fetchExplorerStats(
  fen: string,
  opts: FetchExplorerOptions = {},
): Promise<ExplorerStats | null> {
  const { source = "masters", topGames = 0, play } = opts;

  const qs = new URLSearchParams({ fen });
  if (play && play.length > 0) qs.set("play", play.join(","));
  if (topGames > 0) qs.set("topGames", String(Math.min(topGames, 15)));

  const path = source === "masters" ? "/masters" : "/lichess";

  try {
   const res = await fetch(`${EXPLORER_BASE}${path}?${qs.toString()}`, {
      headers: buildHeaders(),
      // Opening stats for a fixed position barely change — cache for a day.
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      console.error(`[lichess-explorer] fetch failed: ${res.status} ${res.statusText} for ${path}?${qs.toString()}`);
      return null;
    }
    const data = await res.json();

    return {
      white: data.white ?? 0,
      draws: data.draws ?? 0,
      black: data.black ?? 0,
      moves: Array.isArray(data.moves) ? data.moves : [],
      topGames: Array.isArray(data.topGames)
        ? data.topGames.map((g: ExplorerTopGameRaw) => ({
            id: g.id,
            winner: g.winner,
            white: { name: g.white?.name ?? "Unknown", rating: g.white?.rating ?? 0 },
            black: { name: g.black?.name ?? "Unknown", rating: g.black?.rating ?? 0 },
            year: g.year,
          }))
        : [],
    };
  } catch (err) {
    console.error(`[lichess-explorer] network error for ${path}?${qs.toString()}:`, err);
    return null;
  }
}

/** Raw shape of a topGames/recentGames entry as returned by the API. */
interface ExplorerTopGameRaw {
  id: string;
  winner?: "white" | "black";
  white?: { name: string; rating: number };
  black?: { name: string; rating: number };
  year?: number;
}

export interface ExplorerPercentages {
  whitePct: number;
  drawPct: number;
  blackPct: number;
  totalGames: number;
}

/** Converts raw white/draws/black counts into rounded percentages. */
export function explorerPercentages(
  stats: ExplorerStats,
): ExplorerPercentages {
  const total = stats.white + stats.draws + stats.black;
  if (total === 0) {
    return { whitePct: 0, drawPct: 0, blackPct: 0, totalGames: 0 };
  }
  const whitePct = Math.round((stats.white / total) * 100);
  const drawPct = Math.round((stats.draws / total) * 100);
  const blackPct = 100 - whitePct - drawPct;
  return { whitePct, drawPct, blackPct, totalGames: total };
}