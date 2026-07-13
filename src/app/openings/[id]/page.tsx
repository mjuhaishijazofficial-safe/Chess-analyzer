"use client";

import { useParams } from "next/navigation";
import { SAMPLE_OPENINGS } from "@/lib/openings-sample-data";

export default function OpeningDetailPage() {
  const params = useParams();
  const opening = SAMPLE_OPENINGS.find((o) => o.id === params.id);

  if (!opening) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Opening not found</h1>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{opening.name}</h1>
      <p className="text-sm opacity-70 mb-1">ECO: {opening.eco}</p>
      <p className="text-sm opacity-70 mb-4">Moves: {opening.moves}</p>
      <p className="text-sm">Category: {opening.category}</p>
    </div>
  );
}