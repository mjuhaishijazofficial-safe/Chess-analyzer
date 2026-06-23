"use client";

import { useEffect, useRef } from "react";
import { CLASS_META, type MoveReview } from "@/lib/chess-review";

export function MoveList({
  moves,
  currentPly,
  onSelect,
}: {
  moves: MoveReview[];
  currentPly: number;
  onSelect: (ply: number) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentPly]);

  const pairs: { no: number; white?: MoveReview; black?: MoveReview }[] = [];
  for (const m of moves) {
    if (m.color === "w") {
      pairs.push({ no: m.moveNo, white: m });
    } else {
      const last = pairs[pairs.length - 1];
      if (last && last.no === m.moveNo && !last.black) last.black = m;
      else pairs.push({ no: m.moveNo, black: m });
    }
  }

  return (
    <div className="max-h-[420px] overflow-y-auto pr-1 lg:max-h-[560px]">
      <button
        onClick={() => onSelect(0)}
        className={`mb-1 w-full rounded-md px-2 py-1 text-left font-mono text-xs transition ${
          currentPly === 0
            ? "bg-accent/15 text-fg"
            : "text-muted hover:bg-fg/5"
        }`}
      >
        ⟲ starting position
      </button>

      <div className="space-y-0.5">
        {pairs.map((p) => (
          <div
            key={`${p.no}-${p.white?.ply ?? "b"}`}
            className="grid grid-cols-[1.9rem_1fr_1fr] items-center gap-1"
          >
            <span className="font-mono text-xs text-faint">{p.no}.</span>
            <MoveCell
              move={p.white}
              active={p.white?.ply === currentPly}
              activeRef={p.white?.ply === currentPly ? activeRef : undefined}
              onSelect={onSelect}
            />
            <MoveCell
              move={p.black}
              active={p.black?.ply === currentPly}
              activeRef={p.black?.ply === currentPly ? activeRef : undefined}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MoveCell({
  move,
  active,
  activeRef,
  onSelect,
}: {
  move?: MoveReview;
  active: boolean;
  activeRef?: React.RefObject<HTMLButtonElement | null>;
  onSelect: (ply: number) => void;
}) {
  if (!move) return <span />;
  const meta = move.classification ? CLASS_META[move.classification] : null;
  return (
    <button
      ref={activeRef}
      onClick={() => onSelect(move.ply)}
      className={`flex items-center justify-between gap-1 rounded-md px-2 py-1 text-left text-sm transition ${
        active ? "bg-accent/15 text-fg" : "text-muted hover:bg-fg/5 hover:text-fg"
      }`}
    >
      <span className="font-medium tabular-nums">{move.san}</span>
      {meta && (
        <span className={`font-mono text-xs ${meta.text}`} title={meta.label}>
          {meta.symbol}
        </span>
      )}
    </button>
  );
}
