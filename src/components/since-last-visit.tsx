"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";

type Platform = "chesscom" | "lichess";

interface RatingSnapshotMap {
  bullet?: number;
  blitz?: number;
  rapid?: number;
  daily?: number;
}

interface Snapshot {
  timestamp: number; // unix seconds
  ratings: RatingSnapshotMap;
  wins: number;
  draws: number;
  losses: number;
}

const LABELS: Record<keyof RatingSnapshotMap, string> = {
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
  daily: "Daily",
};

export function SinceLastVisit({
  username,
  platform,
  ratings,
  wins,
  draws,
  losses,
}: {
  username: string;
  platform: Platform;
  ratings: RatingSnapshotMap;
  wins: number;
  draws: number;
  losses: number;
}) {
  // undefined = haven't checked localStorage yet (avoids a flash on first paint)
  const [prev, setPrev] = useState<Snapshot | null | undefined>(undefined);

  useEffect(() => {
    const key = `chessdeeper:snapshot:${platform}:${username.toLowerCase()}`;
    let previous: Snapshot | null = null;
    try {
      const raw = localStorage.getItem(key);
      if (raw) previous = JSON.parse(raw) as Snapshot;
    } catch {
      /* ignore */
    }
    setPrev(previous);

    const next: Snapshot = {
      timestamp: Math.floor(Date.now() / 1000),
      ratings,
      wins,
      draws,
      losses,
    };
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, platform]);

  if (prev === undefined) return null;

  if (prev === null) {
    return (
      <div className="panel flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-muted">
        <span>👋</span>
        First time here — we&apos;ll show you what changed on your next visit.
      </div>
    );
  }

  const deltas = (Object.keys(LABELS) as (keyof RatingSnapshotMap)[])
    .map((k) => {
      const curr = ratings[k];
      const before = prev.ratings[k];
      if (curr == null || before == null || curr === before) return null;
      return { key: k, delta: curr - before };
    })
    .filter((d): d is { key: keyof RatingSnapshotMap; delta: number } => d !== null);

  const winsDelta = wins - prev.wins;
  const drawsDelta = draws - prev.draws;
  const lossesDelta = losses - prev.losses;
  const anyGameDelta = winsDelta !== 0 || drawsDelta !== 0 || lossesDelta !== 0;

  if (deltas.length === 0 && !anyGameDelta) {
    return (
      <div className="panel flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-muted">
        <span>·</span>
        No change since your last visit ({timeAgo(prev.timestamp)}).
      </div>
    );
  }

  return (
    <div className="panel rounded-2xl p-4">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-faint">
        since your last visit · {timeAgo(prev.timestamp)}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {deltas.map((d) => (
          <span key={d.key} className="inline-flex items-center gap-1.5">
            <span className="text-muted">{LABELS[d.key]}</span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                d.delta > 0 ? "text-accent" : "text-rose"
              }`}
            >
              {d.delta > 0 ? "+" : ""}
              {d.delta}
            </span>
          </span>
        ))}
        {anyGameDelta && (
          <span className="inline-flex items-center gap-1.5 text-muted">
            in your recent sample:
            {winsDelta !== 0 && (
              <span className="font-mono text-accent">
                {winsDelta > 0 ? "+" : ""}
                {winsDelta}W
              </span>
            )}
            {drawsDelta !== 0 && (
              <span className="font-mono text-faint">
                {drawsDelta > 0 ? "+" : ""}
                {drawsDelta}D
              </span>
            )}
            {lossesDelta !== 0 && (
              <span className="font-mono text-rose">
                {lossesDelta > 0 ? "+" : ""}
                {lossesDelta}L
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
