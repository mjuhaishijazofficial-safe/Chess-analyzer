// src/app/openings/compare/page.tsx
//
// Side-by-side comparison of 2-3 openings. Selection lives in the URL
// (?a=...&b=...&c=...) via CompareSelector (client component); this page
// stays a server component so it can fetch live Lichess stats for each
// selected opening in parallel.

import Link from "next/link";
import { SAMPLE_OPENINGS } from "@/lib/openings-sample-data";
import { CompareSelector } from "@/components/compare-selector";
import { MiniChessBoard } from "@/components/mini-chess-board";
import { fenAfterMoves } from "@/lib/moves-to-fen";
import { fetchExplorerStats, explorerPercentages } from "@/lib/lichess-explorer";
import type { OpeningSummary } from "@/types/opening";

interface PageProps {
  searchParams: Promise<{ a?: string; b?: string; c?: string }>;
}

const colors = {
  bg: "#0b0d0f",
  panel: "#14171a",
  border: "#262b2f",
  text: "#e8e6e1",
  muted: "#838b93",
  accent: "#c9a869",
  win: "#4ea672",
};

async function getComparisonData(opening: OpeningSummary) {
  const fen = fenAfterMoves(opening.moves);
  const liveStats = await fetchExplorerStats(fen, { source: "masters", topGames: 0 });
  const pct = liveStats ? explorerPercentages(liveStats) : null;
  const hasLiveData = pct !== null && pct.totalGames > 0;

  return {
    opening,
    whitePct: hasLiveData ? pct!.whitePct : opening.winRateWhite,
    drawPct: hasLiveData ? pct!.drawPct : opening.drawRate,
    blackPct: hasLiveData
      ? 100 - pct!.whitePct - pct!.drawPct
      : 100 - opening.winRateWhite - opening.drawRate,
    hasLiveData,
    totalGames: pct?.totalGames ?? 0,
  };
}

export default async function CompareOpeningsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ids = [params.a, params.b, params.c].filter(Boolean) as string[];
  const selectedOpenings = ids
    .map((id) => SAMPLE_OPENINGS.find((o) => o.id === id))
    .filter((o): o is OpeningSummary => Boolean(o));

  const comparisons = await Promise.all(selectedOpenings.map(getComparisonData));

  return (
    <main style={{ minHeight: "100vh", background: colors.bg, padding: "48px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link
          href="/openings"
          style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: colors.muted, textDecoration: "none" }}
        >
          ← back to search
        </Link>

        <p
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: colors.muted,
            margin: "24px 0 16px",
            textAlign: "center",
          }}
        >
          Compare Openings
        </p>

        <CompareSelector dataset={SAMPLE_OPENINGS} />

        {comparisons.length === 0 ? (
          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 13,
              color: colors.muted,
              textAlign: "center",
              marginTop: 48,
            }}
          >
            Pick at least one opening above to see its stats.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${comparisons.length}, 1fr)`,
              gap: 16,
              marginTop: 40,
            }}
          >
            {comparisons.map(({ opening, whitePct, drawPct, blackPct, hasLiveData, totalGames }) => (
              <div
                key={opening.id}
                style={{
                  background: colors.panel,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <MiniChessBoard moves={opening.moves} size={120} />
                </div>

                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 12,
                    color: colors.accent,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    padding: "2px 6px",
                  }}
                >
                  {opening.eco}
                </span>

                <h2
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 18,
                    color: colors.text,
                    margin: "8px 0 4px",
                  }}
                >
                  {opening.name}
                </h2>

                <p
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 12,
                    color: colors.muted,
                    margin: "0 0 16px",
                  }}
                >
                  {opening.category} · {opening.difficulty}
                </p>

                <Row label="White wins" value={`${whitePct}%`} />
                <Row label="Draws" value={`${drawPct}%`} />
                <Row label="Black wins" value={`${blackPct}%`} />
                <Row label="Popularity" value={`${opening.popularity}%`} />

                <p
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    color: colors.muted,
                    marginTop: 12,
                  }}
                >
                  {hasLiveData ? `live · ${totalGames.toLocaleString()} master games` : "estimated data"}
                </p>

                <Link
                  href={`/openings/${opening.id}`}
                  style={{
                    display: "block",
                    marginTop: 16,
                    textAlign: "center",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 12,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    padding: "8px 0",
                    textDecoration: "none",
                  }}
                >
                  View full details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: colors.muted }}>{label}</span>
      <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: colors.text }}>{value}</span>
    </div>
  );
}
