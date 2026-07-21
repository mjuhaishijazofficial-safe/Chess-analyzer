import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildLanguageAlternates } from "@/lib/seo";
import { getPlayerBundle as getChesscomBundle } from "@/lib/chesscom";
import { getPlayerBundle as getLichessBundle } from "@/lib/lichess";
import { toChesscomBundle } from "@/lib/lichess-adapter";
import type { PlayerStats } from "@/lib/chesscom";
import { toRow, TIME_CLASS_META, type GameRow } from "@/lib/format";
import { ProfileHeader } from "@/components/profile-header";
import { SinceLastVisit } from "@/components/since-last-visit";
import { RatingCards, SectionTitle } from "@/components/rating-cards";
import { RatingChart } from "@/components/rating-chart";
import { GamesTable } from "@/components/games-table";

/**
 * Lichess's public API doesn't expose a per-time-control career W/L/D record
 * (only an overall count). We approximate it using the recent games we
 * already fetched, so the rating cards show something real instead of
 * "No record". Only fills in a record where the adapter left it empty.
 */
function attachRecentRecords(
  stats: PlayerStats | null,
  rows: GameRow[],
): PlayerStats | null {
  if (!stats) return stats;

  const grouped: Record<string, { win: number; draw: number; loss: number }> = {};
  for (const r of rows) {
    const key = TIME_CLASS_META[r.timeClass].statKey;
    grouped[key] ??= { win: 0, draw: 0, loss: 0 };
    grouped[key][r.outcome]++;
  }

  const next: PlayerStats = { ...stats };
  type GameTimeStatKey = "chess_bullet" | "chess_blitz" | "chess_rapid" | "chess_daily";
  for (const key of Object.keys(grouped)) {
    const k = key as GameTimeStatKey;
    const existing = next[k];
    if (existing && !existing.record) {
      next[k] = { ...existing, record: grouped[key] };
    }
  }
  return next;
}

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
  searchParams: Promise<{ platform?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const { platform } = await searchParams;
  const site = platform === "lichess" ? "Lichess" : "Chess.com";
  return {
    title: `@${username.toLowerCase()}`,
    description: `${site} profile, ratings and recent games for ${username}.`,
    alternates: {
      languages: buildLanguageAlternates(`/player/${username.toLowerCase()}`),
    },
  };
}

export default async function PlayerPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { platform } = await searchParams;
  const isLichess = platform === "lichess";

  const bundle = isLichess
    ? await getLichessBundle(username.toLowerCase()).then(
        (b) => (b ? toChesscomBundle(b) : null),
      )
    : await getChesscomBundle(username.toLowerCase());

  if (!bundle) notFound();

  const { profile, stats, games } = bundle;
  const rows = games.map((g) => toRow(g, profile.username));
  const displayStats = isLichess ? attachRecentRecords(stats, rows) : stats;

  const tally = rows.reduce(
    (acc, r) => {
      acc[r.outcome]++;
      return acc;
    },
    { win: 0, draw: 0, loss: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <ProfileHeader
        profile={profile}
        platform={isLichess ? "lichess" : "chesscom"}
      />

      <SinceLastVisit
        username={profile.username}
        platform={isLichess ? "lichess" : "chesscom"}
        ratings={{
          bullet: displayStats?.chess_bullet?.last?.rating,
          blitz: displayStats?.chess_blitz?.last?.rating,
          rapid: displayStats?.chess_rapid?.last?.rating,
          daily: displayStats?.chess_daily?.last?.rating,
        }}
        wins={tally.win}
        draws={tally.draw}
        losses={tally.loss}
      />

      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Games analyzed" value={String(rows.length)} />
          <SummaryStat
            label="Wins"
            value={String(tally.win)}
            tone="accent"
          />
          <SummaryStat label="Draws" value={String(tally.draw)} />
          <SummaryStat label="Losses" value={String(tally.loss)} tone="rose" />
        </div>
      )}

      <RatingCards stats={displayStats} />
      {isLichess && (
        <p className="-mt-6 text-xs text-faint">
          * Lichess win/draw/loss records are based on your last {rows.length}{" "}
          games — Lichess&apos;s public API doesn&apos;t expose full
          per-time-control history like Chess.com does.
        </p>
      )}

      <section>
        <SectionTitle>// rating trend</SectionTitle>
        <RatingChart rows={rows} />
      </section>

      <section id="recent-games">
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>// recent games</SectionTitle>
          <span className="font-mono text-xs text-faint">
            latest {rows.length}
          </span>
        </div>
        {rows.length > 0 ? (
          <GamesTable
            rows={rows}
            username={profile.username}
            platform={isLichess ? "lichess" : "chesscom"}
          />
        ) : (
          <p className="panel rounded-2xl p-6 text-sm text-muted">
            No recent games found in this player&apos;s public archives.
          </p>
        )}
      </section>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "accent" | "rose";
}) {
  const color =
    tone === "accent" ? "text-accent" : tone === "rose" ? "text-rose" : "text-fg";
  return (
    <div className="panel rounded-xl p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  );
}
