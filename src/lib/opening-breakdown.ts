import type { Game } from "./chesscom";
import { viewFor } from "./format";

export interface OpeningStat {
  label: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

/**
 * Chess.com's `eco` field is a URL like
 * "https://www.chess.com/openings/Sicilian-Defense-2.Nf3" — the Lichess
 * adapter already fills this field with a plain, readable name. This
 * normalizes both into one readable label.
 */
function normalizeOpeningLabel(eco: string): string {
  if (eco.startsWith("http")) {
    const slug = eco.split("/").filter(Boolean).pop() ?? eco;
    try {
      return decodeURIComponent(slug).replace(/-/g, " ");
    } catch {
      return slug.replace(/-/g, " ");
    }
  }
  return eco;
}

/**
 * Collapses a specific line down to its opening family for grouping, e.g.
 * "Sicilian Defense: Bowdler Attack" and "Sicilian Defense: Alapin
 * Variation" both roll up under "Sicilian Defense" so the breakdown isn't
 * split into dozens of near-duplicate one-game rows.
 */
function familyOf(label: string): string {
  return label.split(":")[0].trim();
}

/**
 * Groups a player's games by opening family and returns a win-rate
 * breakdown, sorted by how often each opening was played. Openings played
 * fewer than `minGames` times are dropped — a single game doesn't tell you
 * anything about how you do with that opening.
 */
export function computeOpeningBreakdown(
  games: Game[],
  username: string,
  minGames = 2,
): OpeningStat[] {
  const groups = new Map<string, { wins: number; draws: number; losses: number }>();

  for (const g of games) {
    if (!g.eco) continue;
    const label = familyOf(normalizeOpeningLabel(g.eco));
    if (!label) continue;

    const v = viewFor(g, username);
    const entry = groups.get(label) ?? { wins: 0, draws: 0, losses: 0 };
    if (v.outcome === "win") entry.wins++;
    else if (v.outcome === "draw") entry.draws++;
    else entry.losses++;
    groups.set(label, entry);
  }

  return [...groups.entries()]
    .map(([label, r]) => {
      const total = r.wins + r.draws + r.losses;
      return {
        label,
        games: total,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        winRate: total ? Math.round((r.wins / total) * 100) : 0,
      };
    })
    .filter((s) => s.games >= minGames)
    .sort((a, b) => b.games - a.games);
}
