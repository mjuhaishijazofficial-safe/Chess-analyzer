"use client";

// src/components/quick-categories.tsx
//
// Grid of category cards (King's Pawn, Sicilian, etc.) shown on the
// Opening Explorer landing page. Clicking a card navigates to /openings
// with the category pre-filtered.

import { useRouter } from "next/navigation";
import { Crown, Gem, Flag, Mountain, Flame, Shield, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import type { CategoryCard } from "@/lib/categories";

interface QuickCategoriesProps {
  categories: CategoryCard[];
}

const colors = {
  panel: "#14171a",
  border: "#262b2f",
  text: "#e8e6e1",
  muted: "#838b93",
  accent: "#c9a869",
};

// Maps the icon name stored in data back to the actual lucide component.
const ICONS: Record<string, LucideIcon> = {
  Crown,
  Gem,
  Flag,
  Mountain,
  Flame,
  Shield,
  ShieldCheck,
  Zap,
};

export function QuickCategories({ categories }: QuickCategoriesProps) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
        width: "100%",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {categories.map((cat) => {
        const Icon = ICONS[cat.icon] ?? Flag;
        return (
          <button
            key={cat.slug}
            type="button"
            onClick={() => router.push(`/openings?category=${cat.slug}`)}
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: "16px 18px",
              textAlign: "left",
              cursor: "pointer",
              transition: "border-color 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
          >
            <Icon size={22} color={colors.accent} strokeWidth={1.75} />
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 15,
                color: colors.text,
                margin: "10px 0 2px",
              }}
            >
              {cat.name}
            </p>
            <p
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
                color: colors.muted,
                margin: 0,
              }}
            >
              {cat.count} opening{cat.count === 1 ? "" : "s"}
            </p>
          </button>
        );
      })}
    </div>
  );
}