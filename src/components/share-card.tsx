"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { CLASS_META, type Classification } from "@/lib/chess-review";

export interface ShareCardData {
  playerName: string;
  opponentName: string;
  accuracy: number | null;
  opponentAccuracy: number | null;
  counts: Record<Classification, number>;
  resultLabel: string;
  platform?: "chesscom" | "lichess";
}

const HIGHLIGHT_ORDER: Classification[] = ["brilliant", "great", "best", "miss", "mistake", "blunder"];

export function ShareCard({
  data,
  onClose,
}: {
  data: ShareCardData;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (!ref.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `chessbuddy-${data.playerName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      /* if export fails, the modal stays open so the person can try again */
    } finally {
      setDownloading(false);
    }
  }

  const highlights = HIGHLIGHT_ORDER.map((cls) => ({ cls, n: data.counts[cls] ?? 0 })).filter(
    (h) => h.n > 0,
  );

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card itself uses inline styles (not Tailwind classes) so
            html-to-image captures it reliably regardless of stylesheet
            load order. */}
        <div
          ref={ref}
          style={{
            width: 480,
            padding: 32,
            borderRadius: 24,
            background: "linear-gradient(160deg, #0b0e13 0%, #101720 100%)",
            border: "1px solid #262b2f",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            color: "#e8e6e1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <span style={{ fontSize: 20 }}>♞</span>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>
              chess<span style={{ color: "#4ade80" }}>buddy</span>
            </span>
            {data.platform && (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#838b93",
                  border: "1px solid #262b2f",
                  borderRadius: 6,
                  padding: "3px 8px",
                }}
              >
                {data.platform === "lichess" ? "Lichess" : "Chess.com"}
              </span>
            )}
          </div>

          <div style={{ fontSize: 14, color: "#838b93", marginBottom: 4 }}>
            {data.playerName} vs {data.opponentName}
          </div>
          <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700, marginBottom: 20 }}>
            {data.resultLabel}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
              {data.accuracy != null ? data.accuracy : "—"}
            </span>
            <span style={{ fontSize: 16, color: "#838b93" }}>% accuracy</span>
          </div>
          {data.opponentAccuracy != null && (
            <div style={{ fontSize: 12, color: "#5b6169", marginTop: 4, marginBottom: 20 }}>
              {data.opponentName}: {data.opponentAccuracy}% accuracy
            </div>
          )}

          {highlights.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {highlights.map(({ cls, n }) => {
                const meta = CLASS_META[cls];
                return (
                  <div
                    key={cls}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#14171a",
                      border: "1px solid #262b2f",
                      borderRadius: 10,
                      padding: "6px 10px",
                      fontSize: 13,
                    }}
                  >
                    <span>{meta.symbol}</span>
                    <span style={{ fontWeight: 700 }}>{n}</span>
                    <span style={{ color: "#838b93", textTransform: "capitalize" }}>
                      {cls}
                      {n === 1 ? "" : "s"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              fontSize: 11,
              color: "#5b6169",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            Stockfish 18 · engine game review
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={download}
            disabled={downloading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
          >
            {downloading ? "Saving…" : "Download PNG"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-panel px-4 py-2 text-sm text-fg transition hover:border-line-strong"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
