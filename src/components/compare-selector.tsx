"use client";

// src/components/compare-selector.tsx
//
// Three dropdowns for picking which openings to compare. Selections are
// stored in the URL (?a=...&b=...&c=...) so a comparison is shareable via
// link and the actual data-fetching/rendering stays in the server
// component that reads these params.

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import type { OpeningSummary } from "@/types/opening";

interface CompareSelectorProps {
  dataset: OpeningSummary[];
}

const colors = {
  panel: "#14171a",
  border: "#262b2f",
  text: "#e8e6e1",
  muted: "#838b93",
  accent: "#c9a869",
};

const SLOTS = ["a", "b", "c"] as const;

export function CompareSelector({ dataset }: CompareSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateSlot(slot: string, openingId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (openingId) params.set(slot, openingId);
    else params.delete(slot);
    router.push(`/openings/compare?${params.toString()}`);
  }

  const sorted = [...dataset].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
      {SLOTS.map((slot, i) => {
        const currentValue = searchParams.get(slot) ?? "";
        return (
          <select
            key={slot}
            value={currentValue}
            onChange={(e) => updateSlot(slot, e.target.value)}
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: currentValue ? colors.text : colors.muted,
              fontFamily: "ui-monospace, monospace",
              fontSize: 13,
              minWidth: 180,
            }}
          >
            <option value="">{i < 2 ? `Opening ${i + 1}…` : "Opening 3 (optional)…"}</option>
            {sorted.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        );
      })}
    </div>
  );
}
