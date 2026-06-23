import type { GameTypeStats, PlayerStats, TimeClass } from "@/lib/chesscom";
import { TIME_CLASS_META, winRate } from "@/lib/format";

const ORDER: TimeClass[] = ["bullet", "blitz", "rapid", "daily"];

const STAT_KEY: Record<TimeClass, keyof PlayerStats> = {
  bullet: "chess_bullet",
  blitz: "chess_blitz",
  rapid: "chess_rapid",
  daily: "chess_daily",
};

export function RatingCards({ stats }: { stats: PlayerStats | null }) {
  if (!stats) return null;

  const cards = ORDER.map((tc) => ({
    tc,
    data: stats[STAT_KEY[tc]] as GameTypeStats | undefined,
  })).filter((c) => c.data?.last?.rating);

  return (
    <section>
      <SectionTitle>// ratings</SectionTitle>

      {cards.length === 0 ? (
        <p className="panel rounded-2xl p-6 text-sm text-muted">
          No rated games on record yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ tc, data }) => (
            <RatingCard key={tc} tc={tc} data={data!} />
          ))}
        </div>
      )}

      <ExtraStats stats={stats} />
    </section>
  );
}

function RatingCard({ tc, data }: { tc: TimeClass; data: GameTypeStats }) {
  const meta = TIME_CLASS_META[tc];
  const record = data.record;
  const total = record ? record.win + record.loss + record.draw : 0;
  const wr = winRate(record);
  const atPeak =
    data.best?.rating && data.last?.rating
      ? data.last.rating >= data.best.rating
      : false;

  return (
    <div className="group panel rounded-2xl p-5 transition hover:border-line-strong">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
          <span className="text-sm">{meta.icon}</span>
          {meta.label}
        </span>
        {data.best?.rating && (
          <span
            title="Peak rating"
            className="font-mono text-xs text-faint"
          >
            ▲ {data.best.rating}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {data.last!.rating}
        </span>
        {atPeak && (
          <span className="mb-1 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-accent">
            peak
          </span>
        )}
      </div>

      {record && total > 0 ? (
        <>
          <RecordBar record={record} />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-mono text-muted">
              <span className="text-accent">{record.win}W</span>{" "}
              <span className="text-faint">{record.draw}D</span>{" "}
              <span className="text-rose">{record.loss}L</span>
            </span>
            {wr != null && (
              <span className="font-mono text-muted">{wr}% win</span>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-faint">No record</p>
      )}
    </div>
  );
}

function RecordBar({
  record,
}: {
  record: { win: number; loss: number; draw: number };
}) {
  const total = record.win + record.loss + record.draw || 1;
  const w = (record.win / total) * 100;
  const d = (record.draw / total) * 100;
  const l = (record.loss / total) * 100;
  return (
    <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-panel-2">
      <span style={{ width: `${w}%` }} className="bg-accent" />
      <span style={{ width: `${d}%` }} className="bg-faint" />
      <span style={{ width: `${l}%` }} className="bg-rose" />
    </div>
  );
}

function ExtraStats({ stats }: { stats: PlayerStats }) {
  const items: { label: string; value: string }[] = [];
  if (stats.tactics?.highest?.rating)
    items.push({
      label: "Tactics (best)",
      value: String(stats.tactics.highest.rating),
    });
  if (stats.puzzle_rush?.best?.score)
    items.push({
      label: "Puzzle Rush (best)",
      value: String(stats.puzzle_rush.best.score),
    });
  if (stats.fide)
    items.push({ label: "FIDE", value: String(stats.fide) });

  if (items.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5"
        >
          <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
            {it.label}
          </span>
          <span className="font-semibold tabular-nums text-fg">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
      {children}
    </h2>
  );
}
