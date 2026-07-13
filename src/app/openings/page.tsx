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
      <p className="text-sm mb-6">Category: {opening.category}</p>

      {opening.variations && opening.variations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Variations</h2>
          <ul className="space-y-2">
            {opening.variations.map((v) => (
              <li
                key={v.name}
                className="border border-white/10 rounded-lg p-3"
              >
                <p className="font-medium">{v.name}</p>
                <p className="text-sm opacity-70">{v.moves}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}