/**
 * Thin, typed client for the Chess.com public "Published-Data" API.
 * Docs: https://www.chess.com/news/view/published-data-api
 *
 * No API key is required — these are public, read-only endpoints. Chess.com
 * asks that requests send a descriptive User-Agent, which we do below.
 * All calls run server-side (Route Handlers / Server Components), so there
 * are no CORS concerns and responses are cached via Next's fetch cache.
 */

const BASE = "https://api.chess.com/pub";

const COMMON_HEADERS: HeadersInit = {
  "User-Agent": "chessbuddy/1.0 (Next.js analytics demo; +https://github.com/chessbuddy)",
  Accept: "application/json",
};

export class ChessApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ChessApiError";
  }
}

async function get<T>(
  path: string,
  revalidate = 300,
): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: COMMON_HEADERS,
      next: { revalidate },
    });
  } catch {
    throw new ChessApiError("Could not reach Chess.com. Please try again.", 503);
  }

  if (res.status === 404) return null;
  if (res.status === 410) return null; // "Gone" — used for empty archives
  if (!res.ok) {
    throw new ChessApiError(
      `Chess.com responded with ${res.status}.`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

/* ----------------------------- Types ------------------------------ */

export interface PlayerProfile {
  player_id: number;
  "@id": string;
  url: string;
  username: string;
  name?: string;
  title?: string;
  avatar?: string;
  followers?: number;
  country?: string; // URL ending in ISO-3166 code
  location?: string;
  last_online?: number;
  joined?: number;
  status?: string;
  is_streamer?: boolean;
  twitch_url?: string;
  verified?: boolean;
  league?: string;
}

export interface RatingSnapshot {
  rating: number;
  date?: number;
  rd?: number;
  game?: string;
}

export interface WinDrawLoss {
  win: number;
  loss: number;
  draw: number;
}

export interface GameTypeStats {
  last?: RatingSnapshot;
  best?: RatingSnapshot;
  record?: WinDrawLoss;
}

export interface PlayerStats {
  chess_rapid?: GameTypeStats;
  chess_blitz?: GameTypeStats;
  chess_bullet?: GameTypeStats;
  chess_daily?: GameTypeStats;
  tactics?: { highest?: RatingSnapshot; lowest?: RatingSnapshot };
  puzzle_rush?: { best?: { total_attempts: number; score: number } };
  fide?: number;
}

export type TimeClass = "rapid" | "blitz" | "bullet" | "daily";

export interface GameSide {
  rating: number;
  result: string;
  "@id": string;
  username: string;
  uuid?: string;
}

export interface Game {
  url: string;
  uuid?: string;
  pgn?: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  time_class: TimeClass;
  rules: string;
  fen?: string;
  white: GameSide;
  black: GameSide;
  accuracies?: { white: number; black: number };
  eco?: string;
}

/* --------------------------- Endpoints ---------------------------- */

export function getProfile(username: string) {
  return get<PlayerProfile>(`/player/${encodeURIComponent(username)}`);
}

export function getStats(username: string) {
  return get<PlayerStats>(`/player/${encodeURIComponent(username)}/stats`);
}

interface ArchivesResponse {
  archives: string[];
}

/**
 * Fetch the player's most recent games by walking back through the monthly
 * archives (newest first) until we've collected `limit` games.
 */
export async function getRecentGames(
  username: string,
  limit = 20,
): Promise<Game[]> {
  const archives = await get<ArchivesResponse>(
    `/player/${encodeURIComponent(username)}/games/archives`,
  );
  if (!archives || archives.archives.length === 0) return [];

  const months = archives.archives.slice(-3).reverse(); // up to last 3 months
  const collected: Game[] = [];

  for (const monthUrl of months) {
    const path = monthUrl.replace(BASE, "");
    // A single flaky month (Chess.com occasionally 500s the current month)
    // shouldn't wipe out the whole list — skip it and keep going.
    const data = await get<{ games: Game[] }>(path, 600).catch(() => null);
    if (data?.games?.length) {
      // archives are ascending by date; newest at the end
      collected.push(...[...data.games].reverse());
    }
    if (collected.length >= limit) break;
  }

  return collected.slice(0, limit);
}

/**
 * Locate a single game by its uuid by scanning recent monthly archives,
 * newest first. Returns the full game object (including PGN) or null.
 */
export async function findGameByUuid(
  username: string,
  uuid: string,
): Promise<Game | null> {
  const archives = await get<ArchivesResponse>(
    `/player/${encodeURIComponent(username)}/games/archives`,
  );
  if (!archives) return null;

  const months = archives.archives.slice(-8).reverse(); // up to last 8 months
  for (const monthUrl of months) {
    const path = monthUrl.replace(BASE, "");
    const data = await get<{ games: Game[] }>(path, 600).catch(() => null);
    const match = data?.games?.find((g) => g.uuid === uuid);
    if (match) return match;
  }
  return null;
}

/* ------------------------------ Leaderboard ------------------------------ */

interface LeaderboardEntry {
  player_id: number;
  "@id": string;
  url: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
}

interface LeaderboardsResponse {
  live_blitz?: LeaderboardEntry[];
}

/** The player currently ranked #1 on Chess.com's live blitz leaderboard. */
export async function getTopPlayer(): Promise<{ username: string } | null> {
  const data = await get<LeaderboardsResponse>("/leaderboards", 3600);
  const top = data?.live_blitz?.[0];
  return top ? { username: top.username } : null;
}

/* --------------------- Convenience aggregate ---------------------- */

export interface PlayerBundle {
  profile: PlayerProfile;
  stats: PlayerStats | null;
  games: Game[];
}

/** Loads everything the dashboard needs. Returns null if the user doesn't exist. */
export async function getPlayerBundle(
  username: string,
): Promise<PlayerBundle | null> {
  const profile = await getProfile(username);
  if (!profile) return null;

  const [stats, games] = await Promise.all([
    getStats(profile.username).catch(() => null),
    getRecentGames(profile.username, 25).catch(() => []),
  ]);

  return { profile, stats, games };
}
