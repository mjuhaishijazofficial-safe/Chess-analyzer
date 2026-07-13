"use client";

import { useRouter } from "next/navigation";
import { OpeningSearch } from "@/components/opening-search";
import { SAMPLE_OPENINGS } from "@/lib/openings-sample-data";

export default function OpeningsPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Openings</h1>
      <OpeningSearch
        dataset={SAMPLE_OPENINGS}
        onSelect={(o) => router.push(`/openings/${o.id}`)}
      />
    </div>
  );
}