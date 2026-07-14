// src/lib/categories.ts
//
// Quick Categories are derived from SAMPLE_OPENINGS (or the real DB later)
// rather than hardcoded — counts stay correct automatically as openings
// are added. Icon/order/slug are the only things we hand-curate.

import { SAMPLE_OPENINGS } from "@/lib/openings-sample-data";

export interface CategoryCard {
  slug: string;
  name: string;
  icon: string; // lucide-react icon component name, e.g. "Crown"
  count: number;
}

// Curated order + icon per category. Categories not listed here still show
// up (icon falls back to "Flag"), so adding a new opening category to the
// dataset never silently disappears from the UI.
const CATEGORY_META: Record<string, { icon: string; order: number }> = {
  "King's Pawn": { icon: "Crown", order: 0 },
  "Queen's Pawn": { icon: "Gem", order: 1 },
  English: { icon: "Flag", order: 2 },
  Indian: { icon: "Mountain", order: 3 },
  Sicilian: { icon: "Flame", order: 4 },
  French: { icon: "Shield", order: 5 },
  "Caro Kann": { icon: "ShieldCheck", order: 6 },
  Gambits: { icon: "Zap", order: 7 },
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getQuickCategories(): CategoryCard[] {
  const counts = new Map<string, number>();
  for (const opening of SAMPLE_OPENINGS) {
    counts.set(opening.category, (counts.get(opening.category) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({
      slug: slugify(name),
      name,
      icon: CATEGORY_META[name]?.icon ?? "Flag",
      count,
    }))
    .sort((a, b) => {
      const orderA = CATEGORY_META[a.name]?.order ?? 99;
      const orderB = CATEGORY_META[b.name]?.order ?? 99;
      return orderA - orderB;
    });
}
