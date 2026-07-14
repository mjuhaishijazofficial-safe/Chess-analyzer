import type {
  PlayerProfile,
  PlayerStats,
  Game,
  GameSide,
  TimeClass,
} from "./chesscom";
import type {
  LichessProfile,
  LichessGame,
  LichessPlayerBundle,
  LichessSpeed,
} from "./lichess";

/* ------------------------- Profile adapter ------------------------- */

export function toChesscomProfile(p: LichessProfile): PlayerProfile {
  return {
    player_id: hashToInt(p.id),
    "@id": p.url,
    url: p.url,
    username: p.username,
    name: undefined,
    title: p.title,
    avatar: undefined, // Lichess doesn't expose profile avatars
    followers: undefined,
    // countryCode() in format.ts splits on "/" and reads the last 2-letter
    // segment — a bare ISO code like "US" already satisfies that.
    country: p.profile?.country,
    location: p.profile?.location,
    last_online: Math.floor(p.seenAt / 1000),
    joined: Math.floor(p.createdAt / 1000),
    status: p.online ? "online" : undefined,
    is_streamer: false,
    verified: false,
    league: undefined,
  };
}

/* -------------------------- Stats adapter --------------------------- */

type GameTimeStatKey = "chess_bullet" | "chess_blitz" | "chess_rapid" | "chess_daily";

const PERF_TO_STAT_KEY: Record<string, GameTimeStatKey> = {
  bullet: "chess_bullet",
  blitz: "chess_blitz",
  rapid: "chess_rapid",
  classical: "chess_daily", // closest fit — chesscom has no "classical" bucket
  correspondence: "chess_daily",
};

export function toChesscomStats(p: LichessProfile): PlayerStats {
  const stats: PlayerStats = {};
  for (const [perf, statKey] of Object.entries(PERF_TO_STAT_KEY)) {
    const entry = p.perfs[perf as keyof typeof p.perfs];
    if (!entry) continue;
    // Don't overwrite classical with a worse correspondence rating
    if (stats[statKey]) continue;
    stats[statKey] = {
      last: { rating: entry.rating },
      best: { rating: entry.rating }, // Lichess doesn't expose a per-perf peak
      record: undefined, // Lichess only gives an overall W/L/D, not per time-control
    };
  }
  return stats;
}

/* --------------------------- Games adapter --------------------------- */

const SPEED_TO_TIME_CLASS: Record<LichessSpeed, TimeClass> = {
  ultraBullet: "bullet",
  bullet: "bullet",
  blitz: "blitz",
  rapid: "rapid",
  classical: "rapid",
  correspondence: "daily",
};

/** Maps a Lichess game's outcome to the same per-side result vocabulary
 * chess.com uses ("win", "checkmated", "resigned", "timeout", "agreed", …)
 * so the existing outcomeFromResult()/resultLabel() helpers work unchanged. */
function perSideResult(
  game: LichessGame,
  side: "white" | "black",
): string {
  const won = game.winner === side;
  const lost = game.winner && game.winner !== side;

  switch (game.status) {
    case "mate":
      return won ? "win" : "checkmated";
    case "resign":
      return won ? "win" : "resigned";
    case "timeout":
    case "outoftime":
      return won ? "win" : "timeout";
    case "stalemate":
      return "stalemate";
    case "draw":
      return "agreed";
    case "aborted":
    case "noStart":
      return "abandoned";
    default:
      if (won) return "win";
      if (lost) return "resigned";
      return "agreed";
  }
}

function toGameSide(
  game: LichessGame,
  side: "white" | "black",
): GameSide {
  const player = game.players[side];
  return {
    rating: player.rating ?? 0,
    result: perSideResult(game, side),
    "@id": "",
    username: player.user?.name ?? "Anonymous",
    uuid: undefined,
  };
}

/** Converts a single Lichess game — used by the game-review page. */
export function toChesscomGame(game: LichessGame): Game {
  return toChesscomGames([game])[0];
}

export function toChesscomGames(games: LichessGame[]): Game[] {
  return games.map((g) => ({
    url: `https://lichess.org/${g.id}`,
    uuid: g.id,
    pgn: g.pgn,
    time_control: "600", // Lichess games list doesn't include clock times by default
    end_time: Math.floor(g.lastMoveAt / 1000),
    rated: g.rated,
    time_class: SPEED_TO_TIME_CLASS[g.speed] ?? "rapid",
    rules: g.variant === "standard" ? "chess" : g.variant,
    fen: undefined,
    white: toGameSide(g, "white"),
    black: toGameSide(g, "black"),
    accuracies: undefined,
    eco: g.opening?.eco,
  }));
}

/* ------------------------------ Bundle ------------------------------- */

export interface AdaptedPlayerBundle {
  profile: PlayerProfile;
  stats: PlayerStats | null;
  games: Game[];
}

export function toChesscomBundle(
  bundle: LichessPlayerBundle,
): AdaptedPlayerBundle {
  return {
    profile: toChesscomProfile(bundle.profile),
    stats: toChesscomStats(bundle.profile),
    games: toChesscomGames(bundle.games),
  };
}

/* ------------------------------ helpers ------------------------------ */

function hashToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
