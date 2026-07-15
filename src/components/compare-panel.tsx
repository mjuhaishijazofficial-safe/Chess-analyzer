import type { PlayerProfile, PlayerStats, TimeClass } from "@/lib/chesscom";
import type { GameRow } from "@/lib/format";
import {
  compactNumber,
  countryCode,
  flagEmoji,
  formatMonthYear,
  TIME_CLASS_META,
} from "@/lib/format";
import { SectionTitle } from "@/components/rating-cards";

type Platform = "chesscom" | "lichess";

export interface ComparePlayer {
  profile: PlayerProfile;
  stats: PlayerStats | null;
  rows: GameRow[];
  platform: Platform;
}

const ORDER: TimeClass[] = ["bullet", "blitz", "rapid", "daily"];

export function ComparePanel({ a, b }: { a: ComparePlayer; b: ComparePlayer }) {
  const ratingRows = ORDER.map((tc) => {
    const key = TIME_CLASS_META[tc].statKey;
    const av = a.stats?.[key]?.last?.rating;
    const bv = b.stats?.[key]?.last?.rating;
    return { tc, av, bv };
  }).filter((r) => r.av != null || r.bv != null);

  const tallyOf = (rows: GameRow[]) =>
    rows.reduce(
      (acc, r) => {
        acc[r.outcome]++;
        return acc;
      },
      { win: 0, draw: 0, loss: 0 },
    );
  const ta = tallyOf(a.rows);
  const tb = tallyOf(b.rows);
  const wrA = a.rows.length ? Math.round((ta.win / a.rows.length) * 100) : null;
  const wrB = b.rows.length ? Math.round((tb.win / b.rows.length) * 100) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
      <div className="grid grid-cols-2 gap-4">
        <PlayerCard player={a} />
        <PlayerCard player={b} />
      </div>

      {ratingRows.length > 0 && (
        <section>
          <SectionTitle>// ratings</SectionTitle>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {ratingRows.map((r) => (
              <RatingCompareRow
                key={r.tc}
                icon={TIME_CLASS_META[r.tc].icon}
                label={TIME_CLASS_META[r.tc].label}
                a={r.av}
                b={r.bv}
              />
            ))}
          </div>
        </section>
      )}

      {(a.rows.length > 0 || b.rows.length > 0) && (
        <section>
          <SectionTitle>// recent form</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <FormCard
              wins={ta.win}
              draws={ta.draw}
              losses={ta.loss}
              winRate={wrA}
              sample={a.rows.length}
            />
            <FormCard
              wins={tb.win}
              draws={tb.draw}
              losses={tb.loss}
              winRate={wrB}
              sample={b.rows.length}
            />
          </div>
          <p className="mt-3 text-xs text-faint">
            Based on each player&apos;s most recent games fetched (up to 25).
          </p>
        </section>
      )}
    </div>
  );
}

function PlayerCard({ player }: { player: ComparePlayer }) {
  const { profile, platform } = player;
  const code = countryCode(profile);
  const siteName = platform === "lichess" ? "Lichess" : "Chess.com";
  const initials = (profile.name ?? profile.username)
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="panel rounded-2xl p-5 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-line bg-panel-2">
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-xl font-semibold text-accent">{initials || "?"}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {profile.title && (
          <span className="rounded-md bg-amber/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-amber">
            {profile.title}
          </span>
        )}
        <h2 className="truncate text-lg font-semibold text-fg">
          {profile.name ?? profile.username}
        </h2>
      </div>
      <div className="font-mono text-xs text-muted">@{profile.username}</div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-xs text-faint">
        <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono uppercase">{siteName}</span>
        {code && <span>{flagEmoji(code)}</span>}
        <span>· joined {formatMonthYear(profile.joined)}</span>
      </div>

      {profile.followers != null && (
        <div className="mt-2 text-xs text-faint">
          {compactNumber(profile.followers)} followers
        </div>
      )}
    </div>
  );
}

function RatingCompareRow({
  icon,
  label,
  a,
  b,
}: {
  icon: string;
  label: string;
  a?: number;
  b?: number;
}) {
  const aWins = a != null && b != null && a > b;
  const bWins = a != null && b != null && b > a;
  const max = Math.max(a ?? 0, b ?? 0, 1);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
      <div className="flex items-center justify-end gap-2">
        <span
          className={`font-mono text-lg font-semibold tabular-nums ${
            aWins ? "text-accent" : "text-fg"
          }`}
        >
          {a ?? "—"}
        </span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-panel-2 sm:w-24">
          <div
            className={`ml-auto h-full rounded-full ${aWins ? "bg-accent" : "bg-faint/60"}`}
            style={{ width: a != null ? `${Math.max(6, (a / max) * 100)}%` : "0%" }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center px-2 font-mono text-[11px] uppercase tracking-wider text-faint">
        <span>{icon}</span>
        <span>{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-panel-2 sm:w-24">
          <div
            className={`h-full rounded-full ${bWins ? "bg-accent" : "bg-faint/60"}`}
            style={{ width: b != null ? `${Math.max(6, (b / max) * 100)}%` : "0%" }}
          />
        </div>
        <span
          className={`font-mono text-lg font-semibold tabular-nums ${
            bWins ? "text-accent" : "text-fg"
          }`}
        >
          {b ?? "—"}
        </span>
      </div>
    </div>
  );
}

function FormCard({
  wins,
  draws,
  losses,
  winRate,
  sample,
}: {
  wins: number;
  draws: number;
  losses: number;
  winRate: number | null;
  sample: number;
}) {
  if (sample === 0) {
    return (
      <div className="panel rounded-2xl p-4 text-center text-sm text-muted">
        No recent games found.
      </div>
    );
  }
  const total = wins + draws + losses || 1;
  return (
    <div className="panel rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">
          {wins}W {draws}D {losses}L
        </span>
        {winRate != null && (
          <span className="font-mono text-sm font-semibold text-accent">{winRate}% win</span>
        )}
      </div>
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-panel-2">
        <span style={{ width: `${(wins / total) * 100}%` }} className="bg-accent" />
        <span style={{ width: `${(draws / total) * 100}%` }} className="bg-faint" />
        <span style={{ width: `${(losses / total) * 100}%` }} className="bg-rose" />
      </div>
    </div>
  );
}
