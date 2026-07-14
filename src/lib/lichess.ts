/**
 * Thin, typed client for the Lichess public API.
 * Docs: https://lichess.org/api
 *
 * No API key is required for these read-only public endpoints. Lichess
 * asks that requests send a descriptive User-Agent, which we do below.
 * All calls run server-side (Route Handlers / Server Components), so there
 * are no CORS concerns and responses are cached via Next's fetch cache.
 */

const BASE = "https://lichess.org";

const COMMON_HEADERS: HeadersInit = {
  "User-Agent": "chessbuddy/1.0 (Next.js analytics demo; +https://github.com/chessbuddy)",
  Accept: "application/json",
};

export class LichessApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "LichessApiError";
  }
}

async function get<T>(
  path: string,
  revalidate = 300,
  headers: HeadersInit = COMMON_HEADERS,
): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers,
      next: { revalidate },
    });
  } catch {
    throw new LichessApiError("Could not reach Lichess. Please try again.", 503);
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new LichessApiError(
      `Lichess responded with ${res.status}.`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

/** Fetch a raw text/ndjson body (used for the games export endpoint). */
async function getText(
  path: string,
  revalidate: number,
  headers: HeadersInit,
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers,
      next: { revalidate },
    });
  } catch {
    throw new LichessApiError("Could not reach Lichess. Please try again.", 503);
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new LichessApiError(
      `Lichess responded with ${res.status}.`,
      res.status,
    );
  }
  return res.text();
}

/* ----------------------------- Types ------------------------------ */

export interface LichessPerfStat {
  games: number;
  rating: number;
  rd: number;
  prog: number;
  prov?: boolean;
}

export interface LichessPerfs {
  bullet?: LichessPerfStat;
  blitz?: LichessPerfStat;
  rapid?: LichessPerfStat;
  classical?: LichessPerfStat;
  correspondence?: LichessPerfStat;
  puzzle?: LichessPerfStat;
}

export interface LichessProfile {
  id: string;
  username: string;
  title?: string;
  patron?: boolean;
  online?: boolean;
  perfs: LichessPerfs;
  createdAt: number;
  seenAt: number;
  playTime?: { total: number; tv: number };
  url: string;
  count?: {
    all: number;
    rated: number;
    win: number;
    loss: number;
    draw: number;
  };
  profile?: {
    country?: string;
    location?: string;
    bio?: string;
    flag?: string;
  };
}

export type LichessSpeed =
  | "ultraBullet"
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

export interface LichessGameSide {
  user?: { name: string; id: string; title?: string };
  rating?: number;
  ratingDiff?: number;
}

export interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: LichessSpeed;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  winner?: "white" | "black";
  players: {
    white: LichessGameSide;
    black: LichessGameSide;
  };
  opening?: { eco: string; name: string; ply: number };
  pgn?: string;
}

export interface RatingHistoryEntry {
  name: string; // perf type, e.g. "Blitz"
  /** Each point is [year, month (0-indexed), day, rating] */
  points: [number, number, number, number][];
}

/* --------------------------- Endpoints ---------------------------- */

export function getProfile(username: string) {
  return get<LichessProfile>(`/api/user/${encodeURIComponent(username)}`);
}

export function getRatingHistory(username: string) {
  return get<RatingHistoryEntry[]>(
    `/api/user/${encodeURIComponent(username)}/rating-history`,
  );
}

/**
 * Fetch the player's most recent games, newest first, with PGN included.
 * Lichess streams games as newline-delimited JSON (ndjson).
 */
export async function getRecentGames(
  username: string,
  limit = 20,
): Promise<LichessGame[]> {
  const qs = new URLSearchParams({
    max: String(limit),
    pgnInJson: "true",
    opening: "true",
    moves: "true",
    sort: "dateDesc",
  });

  const body = await getText(
    `/api/games/user/${encodeURIComponent(username)}?${qs.toString()}`,
    300,
    { ...COMMON_HEADERS, Accept: "application/x-ndjson" },
  ).catch(() => null);

  if (!body) return [];

  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as LichessGame;
      } catch {
        return null;
      }
    })
    .filter((g): g is LichessGame => g !== null);
}

/**
 * Fetch a single game by its id, including PGN.
 */
export async function findGameById(gameId: string): Promise<LichessGame | null> {
  const body = await getText(
    `/game/export/${encodeURIComponent(gameId)}?pgnInJson=true&opening=true&moves=true`,
    600,
    { ...COMMON_HEADERS, Accept: "application/json" },
  ).catch(() => null);

  if (!body) return null;
  try {
    return JSON.parse(body) as LichessGame;
  } catch {
    return null;
  }
}

/* --------------------- Convenience aggregate ---------------------- */

export interface LichessPlayerBundle {
  profile: LichessProfile;
  ratingHistory: RatingHistoryEntry[] | null;
  games: LichessGame[];
}

/** Loads everything the dashboard needs. Returns null if the user doesn't exist. */
export async function getPlayerBundle(
  username: string,
): Promise<LichessPlayerBundle | null> {
  const profile = await getProfile(username);
  if (!profile) return null;

  const [ratingHistory, games] = await Promise.all([
    getRatingHistory(profile.username).catch(() => null),
    getRecentGames(profile.username, 25).catch(() => []),
  ]);

  return { profile, ratingHistory, games };
}
