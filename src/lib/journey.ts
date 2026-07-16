import type { Game } from "./chesscom";
import { viewFor, type Outcome } from "./format";

export interface BiggestWin {
  opponentName: string;
  opponentRating: number;
  myRating: number;
  url: string;
  endTime: number;
}

/** The single most impressive win in the given games — highest-rated
 * opponent beaten. Returns null if there are no wins in the sample. */
export function computeBiggestWin(games: Game[], username: string): BiggestWin | null {
  let best: BiggestWin | null = null;
  for (const g of games) {
    const v = viewFor(g, username);
    if (v.outcome !== "win") continue;
    if (!best || v.opponent.rating > best.opponentRating) {
      best = {
        opponentName: v.opponent.username,
        opponentRating: v.opponent.rating,
        myRating: v.myRating,
        url: g.url,
        endTime: g.end_time,
      };
    }
  }
  return best;
}

export interface BestStreak {
  length: number;
  /** True if the streak was still going at the most recent game in the sample. */
  current: boolean;
}

/** Longest run of consecutive wins in the given games, walked in
 * chronological order. Games must include `end_time` to sort by. */
export function computeBestStreak(games: Game[], username: string): BestStreak {
  const sorted = [...games].sort((a, b) => a.end_time - b.end_time);
  let best = 0;
  let run = 0;
  let bestEndedAtLast = false;

  for (let i = 0; i < sorted.length; i++) {
    const v = viewFor(sorted[i], username);
    if (v.outcome === "win") {
      run++;
      if (run > best) {
        best = run;
        bestEndedAtLast = i === sorted.length - 1;
      }
    } else {
      run = 0;
    }
  }

  return { length: best, current: bestEndedAtLast && best > 0 };
}

/** A friendly "next milestone" rating target — the next round hundred
 * above the player's current rating. */
export function computeNextGoal(currentRating: number): number {
  return Math.ceil((currentRating + 1) / 100) * 100;
}

/** Simple win/draw/loss tally, reused across a few journey tiles. */
export function tallyOutcomes(games: Game[], username: string): Record<Outcome, number> {
  const tally: Record<Outcome, number> = { win: 0, draw: 0, loss: 0 };
  for (const g of games) {
    tally[viewFor(g, username).outcome]++;
  }
  return tally;
}
