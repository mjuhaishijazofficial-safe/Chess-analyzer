import Link from "next/link";
import { BlunderReportCard } from "@/components/blunder-report";

export const metadata = { title: "Stats" };

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto mb-8 flex max-w-2xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-fg">Stats</h1>
          <p className="text-sm text-muted">
            Deeper analysis beyond your dashboard overview, powered by the same Stockfish engine as Game Review.
          </p>
        </div>
        <Link
          href="/compare"
          className="ring-focus inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-black transition hover:brightness-110"
        >
          ⚖️ Compare two players
          <span aria-hidden>→</span>
        </Link>
      </div>

      <BlunderReportCard />
    </div>
  );
}
