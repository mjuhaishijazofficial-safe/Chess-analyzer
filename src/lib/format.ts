import type { Game, PlayerProfile, TimeClass } from "./chesscom";

/* --------------------------- Outcomes ----------------------------- */

export type Outcome = "win" | "loss" | "draw";

const DRAW_RESULTS = new Set([
  "agreed",
  "repetition",
  "stalemate",
  "insufficient",
  "50move",
  "timevsinsufficient",
]);

const LOSS_RESULTS = new Set([
  "checkmated",
  "timeout",
  "resigned",
  "lose",
  "abandoned",
  "kingofthehill",
  "threecheck",
  "bughousepartnerlose",
]);

export function outcomeFromResult(result: string): Outcome {
  if (result === "win") return "win";
  if (DRAW_RESULTS.has(result)) return "draw";
  if (LOSS_RESULTS.has(result)) return "loss";
  return "loss";
}

const RESULT_LABELS: Record<string, string> = {
  win: "Won",
  checkmated: "Checkmated",
  timeout: "Lost on time",
  resigned: "Resigned",
  abandoned: "Abandoned",
  agreed: "Draw agreed",
  repetition: "Repetition",
  stalemate: "Stalemate",
  insufficient: "Insufficient material",
  "50move": "50-move rule",
  timevsinsufficient: "Time vs insufficient",
  lose: "Lost",
};

export function resultLabel(result: string): string {
  return RESULT_LABELS[result] ?? result;
}

/* ----------------------- Player perspective ----------------------- */

export interface GameView {
  game: Game;
  color: "white" | "black";
  outcome: Outcome;
  myRating: number;
  opponent: { username: string; rating: number };
  result: string; // raw result for "my" side
}

export function viewFor(game: Game, username: string): GameView {
  const lower = username.toLowerCase();
  const color = game.white.username.toLowerCase() === lower ? "white" : "black";
  const me = color === "white" ? game.white : game.black;
  const opp = color === "white" ? game.black : game.white;
  return {
    game,
    color,
    outcome: outcomeFromResult(me.result),
    myRating: me.rating,
    opponent: { username: opp.username, rating: opp.rating },
    result: me.result,
  };
}

/* --------------------------- Time class --------------------------- */

export const TIME_CLASS_META: Record<
  TimeClass,
  { label: string; icon: string; statKey: keyof TimeClassStatMap }
> = {
  bullet: { label: "Bullet", icon: "⚡", statKey: "chess_bullet" },
  blitz: { label: "Blitz", icon: "🔥", statKey: "chess_blitz" },
  rapid: { label: "Rapid", icon: "⏱️", statKey: "chess_rapid" },
  daily: { label: "Daily", icon: "📅", statKey: "chess_daily" },
};

type TimeClassStatMap = {
  chess_bullet: unknown;
  chess_blitz: unknown;
  chess_rapid: unknown;
  chess_daily: unknown;
};

/** "600" -> "10 min", "300+5" -> "5|3", "1/259200" -> "3 days" */
export function timeControlLabel(tc: string): string {
  if (tc.startsWith("1/")) {
    const secs = Number(tc.slice(2));
    const days = Math.round(secs / 86400);
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  const [baseStr, incStr] = tc.split("+");
  const base = Number(baseStr);
  const inc = incStr ? Number(incStr) : 0;
  const minutes = base / 60;
  const baseLabel =
    minutes >= 1
      ? `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)} min`
      : `${base} sec`;
  return inc ? `${baseLabel} +${inc}` : baseLabel;
}

/* ----------------------------- Dates ------------------------------ */

export function formatDate(unix?: number): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonthYear(unix?: number): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export function timeAgo(unix?: number): string {
  if (!unix) return "—";
  const seconds = Math.floor(Date.now() / 1000 - unix);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* ---------------------------- Country ----------------------------- */

export function countryCode(profile: PlayerProfile): string | null {
  if (!profile.country) return null;
  const parts = profile.country.split("/");
  const code = parts[parts.length - 1];
  return code && code.length === 2 ? code.toUpperCase() : null;
}

export function flagEmoji(code: string | null): string {
  if (!code || code.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + (code.charCodeAt(0) - 65),
    A + (code.charCodeAt(1) - 65),
  );
}

/* ----------------------------- Misc ------------------------------- */

export function winRate(record?: {
  win: number;
  loss: number;
  draw: number;
}): number | null {
  if (!record) return null;
  const total = record.win + record.loss + record.draw;
  if (total === 0) return null;
  return Math.round((record.win / total) * 100);
}

export function compactNumber(n?: number): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

export function titleFromProfile(profile: PlayerProfile): string | null {
  return profile.title ?? null;
}

/* ----------------------- Serializable game row -------------------- */

export interface GameRow {
  url: string;
  uuid: string | null;
  endTime: number;
  timeClass: TimeClass;
  timeControl: string;
  rated: boolean;
  color: "white" | "black";
  myRating: number;
  oppName: string;
  oppRating: number;
  outcome: Outcome;
  result: string;
  rules: string;
}

export function toRow(game: Game, username: string): GameRow {
  const v = viewFor(game, username);
  return {
    url: game.url,
    uuid: game.uuid ?? null,
    endTime: game.end_time,
    timeClass: game.time_class,
    timeControl: game.time_control,
    rated: game.rated,
    color: v.color,
    myRating: v.myRating,
    oppName: v.opponent.username,
    oppRating: v.opponent.rating,
    outcome: v.outcome,
    result: v.result,
    rules: game.rules,
  };
}
