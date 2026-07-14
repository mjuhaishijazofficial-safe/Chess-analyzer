"use client";

// src/app/openings/page.tsx
// Dedicated Opening Explorer landing page. Starts with just the search
// feature — categories, popular cards, learning hub etc. get added here
// as we build each feature.

import { useRouter } from "next/navigation";
import { OpeningSearch } from "@/components/opening-search";
import { SAMPLE_OPENINGS } from "@/lib/openings-sample-data";

export default function OpeningsPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0d0f",
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
            color: "#838b93",
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
            color: "#838b93",
            marginTop: 24,
          }}
        >
          try: "sicilian" · "C50" · "e4 e5"
        </p>
      </div>
    </main>
  );
}
