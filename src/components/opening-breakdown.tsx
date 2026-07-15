import type { OpeningStat } from "@/lib/opening-breakdown";
import { SectionTitle } from "@/components/rating-cards";

export function OpeningBreakdown({ stats }: { stats: OpeningStat[] }) {
  if (stats.length === 0) return null;
  const top = stats.slice(0, 6);

  return (
    <section>
      <SectionTitle>// opening repertoire</SectionTitle>
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {top.map((s) => (
          <div key={s.label} className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-fg">{s.label}</div>
              <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-panel-2">
                <span
                  style={{ width: `${(s.wins / s.games) * 100}%` }}
                  className="bg-accent"
                />
                <span
                  style={{ width: `${(s.draws / s.games) * 100}%` }}
                  className="bg-faint"
                />
                <span
                  style={{ width: `${(s.losses / s.games) * 100}%` }}
                  className="bg-rose"
                />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-sm font-semibold text-fg">
                {s.winRate}%
              </div>
              <div className="font-mono text-[11px] text-faint">
                {s.games} game{s.games === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-faint">
        Based on your most recently fetched games. Only openings played 2+
        times are shown.
      </p>
    </section>
  );
}
