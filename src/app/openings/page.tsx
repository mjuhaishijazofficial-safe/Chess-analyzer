"use client";

// src/app/openings/page.tsx
// Dedicated Opening Explorer landing page: search bar, Quick Categories,
// then Popular Openings. Clicking a category filters the list shown below.

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OpeningSearch } from "@/components/opening-search";
import { QuickCategories } from "@/components/quick-categories";
import { PopularOpenings } from "@/components/popular-openings";
import { SAMPLE_OPENINGS } from "@/lib/openings-sample-data";
import { getQuickCategories } from "@/lib/categories";

const colors = {
  bg: "#0b0d0f",
  panel: "#14171a",
  border: "#262b2f",
  text: "#e8e6e1",
  muted: "#838b93",
  accent: "#c9a869",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SECTION_LABEL_STYLE = {
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase" as const,
  color: colors.muted,
  marginBottom: 16,
  textAlign: "left" as const,
};

export default function OpeningsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");

  const categories = getQuickCategories();
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const filteredOpenings = activeCategory
    ? SAMPLE_OPENINGS.filter((o) => slugify(o.category) === categorySlug)
    : [];

  const popularOpenings = [...SAMPLE_OPENINGS]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 8);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        padding: "64px 24px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: colors.muted,
            marginBottom: 24,
          }}
        >
          Opening Explorer
        </p>

        <OpeningSearch
          dataset={SAMPLE_OPENINGS}
          onSelect={(opening) => {
            router.push(`/openings/${opening.id}`);
          }}
        />

        <p
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            color: colors.muted,
            margin: "24px 0 40px",
          }}
        >
          try: "sicilian" · "C50" · "e4 e5"
        </p>

        <p style={SECTION_LABEL_STYLE}>Browse by category</p>
        <QuickCategories categories={categories} />
      </div>

      {activeCategory ? (
        <div style={{ maxWidth: 720, margin: "40px auto 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: colors.text, margin: 0 }}>
              {activeCategory.name}
            </h2>
            <button
              type="button"
              onClick={() => router.push("/openings")}
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
                color: colors.muted,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              clear ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredOpenings.map((opening) => (
              <Link
                key={opening.id}
                href={`/openings/${opening.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: colors.panel,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  textDecoration: "none",
                }}
              >
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
                <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: colors.text }}>
                  {opening.name}
                </span>
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 12,
                    color: colors.muted,
                    marginLeft: "auto",
                  }}
                >
                  {opening.popularity}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 960, margin: "40px auto 0" }}>
          <p style={SECTION_LABEL_STYLE}>Popular openings</p>
          <PopularOpenings openings={popularOpenings} />
        </div>
      )}
    </main>
  );
}
