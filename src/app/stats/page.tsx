import { BlunderReportCard } from "@/components/blunder-report";

export const metadata = { title: "Stats" };

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-2xl font-bold text-fg">Stats</h1>
        <p className="mb-6 text-sm text-muted">
          Deeper analysis beyond your dashboard overview, powered by the same Stockfish engine as Game Review.
        </p>
      </div>

      <BlunderReportCard />
    </div>
  );
}
