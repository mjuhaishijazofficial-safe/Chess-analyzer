import Link from "next/link";
import { BlunderReportCard } from "@/components/blunder-report";

export const metadata = { title: "Stats" };

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Stats</h1>
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-fg transition hover:border-line-strong"
          >
            Compare players
            <span aria-hidden>→</span>
          </Link>
        </div>
        <p className="mb-6 text-sm text-muted">
          Deeper analysis beyond your dashboard overview, powered by the same Stockfish engine as Game Review.
        </p>
      </div>

      <BlunderReportCard />
    </div>
  );
}
