// src/app/openings/[id]/page.tsx
// Placeholder Opening Details page. Shows the basic info we already have
// from SAMPLE_OPENINGS. Will be expanded into the full page (board, move
// tree, engine analysis, plans, mistakes, games, etc.) as a later feature.

import Link from "next/link";
import { notFound } from "next/navigation";
import { SAMPLE_OPENINGS } from "@/lib/openings-sample-data";

interface PageProps {
  params: { id: string };
}

export default function OpeningDetailsPage({ params }: PageProps) {
  const opening = SAMPLE_OPENINGS.find((o) => o.id === params.id);

  if (!opening) {
    notFound();
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

  return (
    <main style={{ minHeight: "100vh", background: colors.bg, padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link
          href="/openings"
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 13,
            color: colors.muted,
            textDecoration: "none",
          }}
        >
          ← back to search
        </Link>

        <div
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.panel,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 13,
                color: colors.accent,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                padding: "2px 8px",
              }}
            >
              {opening.eco}
            </span>
            {opening.trending && (
              <span
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: colors.win,
                  border: `1px solid ${colors.win}`,
                  borderRadius: 6,
                  padding: "2px 8px",
                }}
              >
                trending
              </span>
            )}
          </div>

          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 28,
              color: colors.text,
              margin: "0 0 16px 0",
            }}
          >
            {opening.name}
          </h1>

          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 14,
              color: colors.muted,
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            {opening.moves}
          </p>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <Stat label="Popularity" value={`${opening.popularity}%`} colors={colors} />
            <Stat label="Win rate (White)" value={`${opening.winRateWhite}%`} colors={colors} />
            <Stat label="Draw rate" value={`${opening.drawRate}%`} colors={colors} />
            <Stat label="Difficulty" value={opening.difficulty} colors={colors} />
          </div>

          {opening.variations && opening.variations.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
              <p
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                  textTransform: "uppercase",
                  color: colors.muted,
                  marginBottom: 10,
                }}
              >
                Variations
              </p>
              {opening.variations.map((v) => (
                <div key={v.name} style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 14, color: colors.text }}>
                    {v.name}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 12,
                      color: colors.muted,
                    }}
                  >
                    {v.moves}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p
          style={{
            marginTop: 16,
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            color: colors.muted,
          }}
        >
          This is a placeholder — board, move tree, engine analysis, plans and games
          will be added when we build the full Opening Details feature.
        </p>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
}) {
  return (
    <div>
      <p
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          textTransform: "uppercase",
          color: colors.muted,
          margin: "0 0 2px 0",
        }}
      >
        {label}
      </p>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: colors.text, margin: 0 }}>
        {value}
      </p>
    </div>
  );
}
