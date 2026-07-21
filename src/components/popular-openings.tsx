"use client";

// src/components/popular-openings.tsx
//
// Horizontal scrollable row of Popular Opening cards: mini board preview,
// ECO, popularity, difficulty, Learn + Favorite buttons.
//
// Favorite button is UI-only for now (local state) — it'll connect to the
// real Favorites feature (Phase 2 on the roadmap) once that exists.

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Star } from "lucide-react";
import { MiniChessBoard } from "@/components/mini-chess-board";
import type { OpeningSummary } from "@/types/opening";

interface PopularOpeningsProps {
  openings: OpeningSummary[];
}

const colors = {
  panel: "#14171a",
  border: "#262b2f",
  text: "#e8e6e1",
  muted: "#838b93",
  accent: "#c9a869",
  win: "#4ea672",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function PopularOpenings({ openings }: PopularOpeningsProps) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 8,
      }}
    >
      {openings.map((opening) => {
        const isFavorite = favorites.has(opening.id);
        return (
          <div
            key={opening.id}
            style={{
              minWidth: 220,
              flexShrink: 0,
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 130,
                background: "#0b0d0f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MiniChessBoard moves={opening.moves} size={104} />
            </div>

            <div style={{ padding: "12px 14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    color: colors.accent,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    padding: "1px 6px",
                  }}
                >
                  {opening.eco}
                </span>
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    color: colors.muted,
                  }}
                >
                  {opening.popularity}%
                </span>
              </div>

              <p
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 14,
                  color: colors.text,
                  margin: "0 0 4px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={opening.name}
              >
                {opening.name}
              </p>
              <p
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 11,
                  color: colors.muted,
                  margin: "0 0 10px",
                }}
              >
                {DIFFICULTY_LABEL[opening.difficulty] ?? opening.difficulty}
              </p>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => router.push(`/openings/${opening.id}`)}
                  style={{
                    flex: 1,
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 12,
                    color: colors.text,
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    padding: "6px 0",
                    cursor: "pointer",
                  }}
                >
                  Learn
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(opening.id)}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={isFavorite}
                  style={{
                    width: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  <Star
                    size={14}
                    color={isFavorite ? colors.win : colors.muted}
                    fill={isFavorite ? colors.win : "none"}
                  />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
