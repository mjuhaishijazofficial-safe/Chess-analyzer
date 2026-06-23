import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlayerBundle } from "@/lib/chesscom";
import { toRow } from "@/lib/format";
import { ProfileHeader } from "@/components/profile-header";
import { RatingCards, SectionTitle } from "@/components/rating-cards";
import { RatingChart } from "@/components/rating-chart";
import { GamesTable } from "@/components/games-table";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username.toLowerCase()}`,
    description: `Chess.com profile, ratings and recent games for ${username}.`,
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { username } = await params;
  const bundle = await getPlayerBundle(username.toLowerCase());
  if (!bundle) notFound();

  const { profile, stats, games } = bundle;
  const rows = games.map((g) => toRow(g, profile.username));

  const tally = rows.reduce(
    (acc, r) => {
      acc[r.outcome]++;
      return acc;
    },
    { win: 0, draw: 0, loss: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <ProfileHeader profile={profile} />

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

      <RatingCards stats={stats} />

      <section>
        <SectionTitle>// rating trend</SectionTitle>
        <RatingChart rows={rows} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>// recent games</SectionTitle>
          <span className="font-mono text-xs text-faint">
            latest {rows.length}
          </span>
        </div>
        {rows.length > 0 ? (
          <GamesTable rows={rows} username={profile.username} />
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
