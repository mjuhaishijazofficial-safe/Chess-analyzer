"use client";

import { winPercent } from "@/lib/chess-review";

/**
 * Vertical evaluation bar. `cpWhite` is centipawns from White's perspective
 * (null while unknown). White's share grows from the bottom.
 */
export function EvalBar({
  cpWhite,
  orientation = "white",
}: {
  cpWhite: number | null;
  orientation?: "white" | "black";
}) {
  const known = cpWhite != null;
  // win% for white = winPercent(cp from white perspective)
  const whitePct = known ? winPercent(cpWhite) : 50;
  // when viewing as black, flip the bar so "your" side is at the bottom
  const bottomIsWhite = orientation === "white";
  const bottomPct = bottomIsWhite ? whitePct : 100 - whitePct;

  return (
    <div
      className="relative h-full w-6 overflow-hidden rounded-md border border-line bg-[#15181d]"
      title={known ? formatEval(cpWhite) : "—"}
    >
      {/* bottom (advantaged-from-bottom) fill */}
      <div
        className="absolute inset-x-0 bottom-0 bg-[#eef1f5] transition-[height] duration-300"
        style={{ height: `${bottomPct}%` }}
      />
      {/* midline */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-accent/40" />
      <span
        className={`absolute inset-x-0 text-center font-mono text-[9px] font-bold ${
          bottomPct > 50 ? "bottom-1 text-black/70" : "top-1 text-white/70"
        }`}
      >
        {known ? formatEval(cpWhite) : ""}
      </span>
    </div>
  );
}

function formatEval(cpWhite: number): string {
  if (Math.abs(cpWhite) >= 90000) {
    const mate = Math.ceil((100000 - Math.abs(cpWhite)) / 100);
    return `M${mate}`;
  }
  const pawns = cpWhite / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(1)}`;
}
