// src/app/openings/[id]/page.tsx
//
// Server component (not "use client") so we can fetch live stats from the
// Lichess Opening Explorer at request time. The board viewer stays a
// client component — Server Components can render Client Components fine.

import { SAMPLE_OPENINGS } from "@/lib/openings-sample-data";
import { OpeningBoardViewer } from "@/components/opening-board-viewer";
import { fenAfterMoves } from "@/lib/moves-to-fen";
import { fetchExplorerStats, explorerPercentages } from "@/lib/lichess-explorer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpeningDetailPage({ params }: PageProps) {
  const { id } = await params;
  const opening = SAMPLE_OPENINGS.find((o) => o.id === id);

  if (!opening) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Opening not found</h1>
      </div>
    );
  }

  // Ask Lichess what actually happens in real master games from this position.
  const fen = fenAfterMoves(opening.moves);
  const liveStats = await fetchExplorerStats(fen, { source: "masters", topGames: 3 });
  const pct = liveStats ? explorerPercentages(liveStats) : null;

  const whitePct = pct?.whitePct ?? opening.winRateWhite;
  const drawPct = pct?.drawPct ?? opening.drawRate;
  const blackPct = pct ? 100 - pct.whitePct - pct.drawPct : 100 - opening.winRateWhite - opening.drawRate;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{opening.name}</h1>
      <p className="text-sm opacity-70 mb-1">ECO: {opening.eco}</p>
      <p className="text-sm opacity-70 mb-1">Moves: {opening.moves}</p>
      <p className="text-sm mb-4">Category: {opening.category}</p>

      <div className="flex items-center gap-4 mb-6 text-sm">
        <span>White wins: <strong>{whitePct}%</strong></span>
        <span>Draws: <strong>{drawPct}%</strong></span>
        <span>Black wins: <strong>{blackPct}%</strong></span>
        <span className="opacity-50 ml-auto">
          {pct ? `live · ${pct.totalGames.toLocaleString()} master games` : "estimated data"}
        </span>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">How it&apos;s played</h2>
        <OpeningBoardViewer moves={opening.moves} />
      </div>

      {liveStats?.topGames && liveStats.topGames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Notable master games</h2>
          <ul className="space-y-2">
            {liveStats.topGames.map((g) => (
              <li key={g.id} className="border border-white/10 rounded-lg p-3 text-sm">
                {g.white.name} ({g.white.rating}) vs {g.black.name} ({g.black.rating})
                {g.year ? ` · ${g.year}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {opening.variations && opening.variations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Variations</h2>
          <ul className="space-y-2">
            {opening.variations.map((v) => (
              <li key={v.name} className="border border-white/10 rounded-lg p-3">
                <p className="font-medium">{v.name}</p>
                <p className="text-sm opacity-70">{v.moves}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
