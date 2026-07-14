"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TimeClass } from "@/lib/chesscom";
import type { GameRow, Outcome } from "@/lib/format";
import {
  resultLabel,
  TIME_CLASS_META,
  timeAgo,
  timeControlLabel,
} from "@/lib/format";

type OutcomeFilter = "all" | Outcome;
type Platform = "chesscom" | "lichess";

const OUTCOME_TABS: { key: OutcomeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "win", label: "Wins" },
  { key: "draw", label: "Draws" },
  { key: "loss", label: "Losses" },
];

export function GamesTable({
  rows,
  username,
  platform = "chesscom",
}: {
  rows: GameRow[];
  username: string;
  platform?: Platform;
}) {
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");
  const [tc, setTc] = useState<TimeClass | "all">("all");

  const timeClasses = useMemo(() => {
    const present = new Set(rows.map((r) => r.timeClass));
    return (["bullet", "blitz", "rapid", "daily"] as TimeClass[]).filter((t) =>
      present.has(t),
    );
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (outcome === "all" || r.outcome === outcome) &&
          (tc === "all" || r.timeClass === tc),
      ),
    [rows, outcome, tc],
  );

  const counts = useMemo(() => {
    const c = { win: 0, loss: 0, draw: 0 };
    for (const r of rows) c[r.outcome]++;
    return c;
  }, [rows]);

  return (
    <div className="panel overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {OUTCOME_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setOutcome(t.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                outcome === t.key
                  ? "bg-fg/10 text-fg"
                  : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
              {t.key !== "all" && (
                <span className="ml-1.5 font-mono text-faint">
                  {counts[t.key as Outcome]}
                </span>
              )}
            </button>
          ))}
        </div>

        {timeClasses.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <Chip active={tc === "all"} onClick={() => setTc("all")}>
              All
            </Chip>
            {timeClasses.map((t) => (
              <Chip key={t} active={tc === t} onClick={() => setTc(t)}>
                {TIME_CLASS_META[t].icon} {TIME_CLASS_META[t].label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted">
          No games match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((r) => (
            <GameRowItem
              key={r.url}
              row={r}
              username={username}
              platform={platform}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function GameRowItem({
  row,
  username,
  platform,
}: {
  row: GameRow;
  username: string;
  platform: Platform;
}) {
  const meta = TIME_CLASS_META[row.timeClass];
  const reviewable = !!row.uuid && row.rules === "chess";
  const query = platform === "lichess" ? "?platform=lichess" : "";
  const reviewHref = reviewable
    ? `/player/${encodeURIComponent(username)}/game/${row.uuid}${query}`
    : null;
  const siteName = platform === "lichess" ? "Lichess" : "Chess.com";

  const inner = (
    <>
      <OutcomeBadge outcome={row.outcome} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span
            title={row.color}
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-line-strong ${
              row.color === "white" ? "bg-fg" : "bg-[#1a1d23]"
            }`}
          />
          <span className="truncate font-medium text-fg">{row.oppName}</span>
          <span className="font-mono text-xs text-faint">
            ({row.oppRating})
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span>
            {meta.icon} {meta.label}
          </span>
          <span className="text-faint">·</span>
          <span className="font-mono">{timeControlLabel(row.timeControl)}</span>
          <span className="text-faint">·</span>
          <span>{resultLabel(row.result)}</span>
          {!row.rated && (
            <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] uppercase text-faint">
              casual
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-mono text-sm tabular-nums text-fg">
          {row.myRating}
        </div>
        <div className="font-mono text-[11px] text-faint">
          {timeAgo(row.endTime)}
        </div>
      </div>
    </>
  );

  return (
    <li className="group relative flex items-center">
      {reviewHref ? (
        <Link
          href={reviewHref}
          className="flex flex-1 items-center gap-3 px-4 py-3 transition hover:bg-fg/[0.025] sm:gap-4"
        >
          {inner}
        </Link>
      ) : (
        <a
          href={row.url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center gap-3 px-4 py-3 transition hover:bg-fg/[0.025] sm:gap-4"
        >
          {inner}
        </a>
      )}

      <div className="flex items-center gap-1 pr-3">
        {reviewHref && (
          <Link
            href={reviewHref}
            className="hidden items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-accent opacity-0 transition group-hover:opacity-100 sm:inline-flex"
          >
            Review ▸
          </Link>
        )}
        <a
          href={row.url}
          target="_blank"
          rel="noreferrer"
          title={`Open on ${siteName}`}
          className="grid h-8 w-8 place-items-center rounded-lg text-faint transition hover:bg-fg/5 hover:text-fg"
        >
          ↗
        </a>
      </div>
    </li>
  );
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const map = {
    win: { ch: "W", cls: "bg-accent/15 text-accent" },
    draw: { ch: "D", cls: "bg-faint/15 text-muted" },
    loss: { ch: "L", cls: "bg-rose/15 text-rose" },
  } as const;
  const { ch, cls } = map[outcome];
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-mono text-sm font-bold ${cls}`}
    >
      {ch}
    </span>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
        active
          ? "border-accent/40 bg-accent/10 text-fg"
          : "border-line bg-panel text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
