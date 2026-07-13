"use client";

import type { Classification } from "@/lib/chess-review";

const ICON: Record<Classification, { bg: string; symbol: string }> = {
  brilliant: { bg: "bg-cyan", symbol: "!!" },
  great: { bg: "bg-[#5b9bd5]", symbol: "!" },
  best: { bg: "bg-[#81b64c]", symbol: "★" },
  excellent: { bg: "bg-[#81b64c]", symbol: "✓" },
  good: { bg: "bg-[#95b776]", symbol: "✓" },
  book: { bg: "bg-[#a88865]", symbol: "▦" },
  inaccuracy: { bg: "bg-[#f7c631]", symbol: "?!" },
  miss: { bg: "bg-rose", symbol: "✗" },
  mistake: { bg: "bg-[#e58f2a]", symbol: "?" },
  blunder: { bg: "bg-rose", symbol: "??" },
  forced: { bg: "bg-faint", symbol: "□" },
};

export function CoachCard({
  title,
  message,
  classification,
  evalBadge,
  thinking,
  openingName,
}: {
  title: string;
  message: string;
  classification: Classification | null;
  evalBadge: string | null;
  thinking?: boolean;
  openingName?: string | null;
}) {
  const icon = classification ? ICON[classification] : null;
  return (
    <div className="flex items-start gap-3">
      <CoachAvatar />
      <div className="relative min-w-0 flex-1">
        {/* bubble tail */}
        <span className="absolute -left-1.5 top-4 h-3 w-3 rotate-45 border-b border-l border-line bg-panel" />
        <div className="relative rounded-2xl rounded-tl-sm border border-line bg-panel p-4">
          <div className="flex items-center gap-2">
            {icon && (
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${icon.bg}`}
              >
                {icon.symbol}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
              {title}
            </span>
            {evalBadge && (
              <span className="shrink-0 rounded-md bg-panel-2 px-2 py-0.5 font-mono text-xs tabular-nums text-muted">
                {evalBadge}
              </span>
            )}
          </div>
          {openingName && (
            <p className="mt-1 truncate text-xs text-muted">
              <span className="mr-1">📖</span>
              {openingName}
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {thinking ? (
              <span className="inline-flex items-center gap-2 text-faint">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
                Thinking…
              </span>
            ) : (
              message
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function CoachAvatar() {
  return (
    <div className="relative shrink-0">
      <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-accent/40 bg-gradient-to-b from-panel-2 to-bg">
        <span className="text-2xl leading-none text-accent">♞</span>
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-bg bg-accent text-[8px] font-bold text-black">
        AI
      </span>
    </div>
  );
}
