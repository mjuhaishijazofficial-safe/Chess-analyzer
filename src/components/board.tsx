"use client";

import type { Classification } from "@/lib/chess-review";

type Orientation = "white" | "black";

const BADGE: Record<Classification, { color: string; symbol: string }> = {
  brilliant: { color: "#26c2a3", symbol: "!!" },
  great: { color: "#5b9bd5", symbol: "!" },
  best: { color: "#81b64c", symbol: "★" },
  excellent: { color: "#81b64c", symbol: "✓" },
  good: { color: "#95b776", symbol: "✓" },
  book: { color: "#a88865", symbol: "▦" },
  inaccuracy: { color: "#f7c631", symbol: "?!" },
  miss: { color: "#fa412d", symbol: "✗" },
  mistake: { color: "#e58f2a", symbol: "?" },
  blunder: { color: "#fa412d", symbol: "??" },
  forced: { color: "#9aa0a6", symbol: "□" },
};

const GLYPH: Record<string, string> = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const LIGHT = "#7d8694";
const DARK = "#454b55";

interface BoardProps {
  fen: string;
  orientation?: Orientation;
  lastMove?: { from: string; to: string } | null;
  arrow?: { from: string; to: string } | null;
  checkSquare?: string | null;
  badge?: { square: string; classification: Classification } | null;
}

export function Board({
  fen,
  orientation = "white",
  lastMove,
  arrow,
  checkSquare,
  badge,
}: BoardProps) {
  const pieces = parseFen(fen);

  return (
    <svg
      viewBox="0 0 8 8"
      className="aspect-square w-full select-none rounded-xl border border-line shadow-xl shadow-black/30"
    >
      {/* squares */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((__, col) => {
          const light = (row + col) % 2 === 0;
          return (
            <rect
              key={`${row}-${col}`}
              x={col}
              y={row}
              width={1}
              height={1}
              fill={light ? LIGHT : DARK}
            />
          );
        }),
      )}

      {/* last-move highlight */}
      {lastMove &&
        [lastMove.from, lastMove.to].map((sq, i) => {
          const { x, y } = sqXY(sq, orientation);
          return (
            <rect
              key={`hl-${i}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill="rgba(74,222,128,0.30)"
            />
          );
        })}

      {/* check highlight */}
      {checkSquare &&
        (() => {
          const { x, y } = sqXY(checkSquare, orientation);
          return (
            <rect
              x={x}
              y={y}
              width={1}
              height={1}
              fill="rgba(251,113,133,0.40)"
            />
          );
        })()}

      {/* coordinate labels */}
      {Array.from({ length: 8 }).map((_, i) => {
        const file = orientation === "white" ? FILES[i] : FILES[7 - i];
        const rank = orientation === "white" ? 8 - i : i + 1;
        return (
          <g key={`coord-${i}`}>
            <text
              x={i + 0.92}
              y={7.92}
              fontSize={0.18}
              textAnchor="end"
              className="fill-white/45 font-mono"
            >
              {file}
            </text>
            <text
              x={0.06}
              y={i + 0.22}
              fontSize={0.18}
              className="fill-white/45 font-mono"
            >
              {rank}
            </text>
          </g>
        );
      })}

      {/* pieces */}
      {pieces.map((p) => {
        const { x, y } = sqXY(p.square, orientation);
        const isWhite = p.color === "w";
        return (
          <text
            key={p.square}
            x={x + 0.5}
            y={y + 0.57}
            fontSize={0.78}
            textAnchor="middle"
            dominantBaseline="central"
            fill={isWhite ? "#f5f7fa" : "#15181d"}
            stroke={isWhite ? "#1b1f26" : "#cdd3da"}
            strokeWidth={0.018}
            paintOrder="stroke"
            style={{ pointerEvents: "none" }}
          >
            {GLYPH[p.type]}
          </text>
        );
      })}

      {/* best-move arrow */}
      {arrow && <Arrow from={arrow.from} to={arrow.to} orientation={orientation} />}

      {/* classification badge on the move's destination square */}
      {badge && (() => {
        const { x, y } = sqXY(badge.square, orientation);
        const style = BADGE[badge.classification];
        const cx = x + 0.82;
        const cy = y + 0.18;
        return (
          <g style={{ pointerEvents: "none" }}>
            <circle cx={cx} cy={cy} r={0.26} fill={style.color} stroke="#0b0e13" strokeWidth={0.04} />
            <text
              x={cx}
              y={cy + 0.012}
              fontSize={style.symbol.length > 1 ? 0.26 : 0.34}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
            >
              {style.symbol}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

function Arrow({
  from,
  to,
  orientation,
}: {
  from: string;
  to: string;
  orientation: Orientation;
}) {
  const a = sqXY(from, orientation);
  const b = sqXY(to, orientation);
  const x1 = a.x + 0.5;
  const y1 = a.y + 0.5;
  const x2 = b.x + 0.5;
  const y2 = b.y + 0.5;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const head = 0.26;
  // stop the shaft short so the arrowhead tip lands on the target center
  const tipX = x2 - ux * 0.04;
  const tipY = y2 - uy * 0.04;
  const baseX = x2 - ux * head;
  const baseY = y2 - uy * head;
  const px = -uy;
  const py = ux;
  const w = 0.13;

  const color = "rgba(74,222,128,0.9)";

  return (
    <g style={{ pointerEvents: "none" }}>
      <line
        x1={x1 + ux * 0.18}
        y1={y1 + uy * 0.18}
        x2={baseX}
        y2={baseY}
        stroke={color}
        strokeWidth={0.13}
        strokeLinecap="round"
      />
      <polygon
        points={`${tipX},${tipY} ${baseX + px * w},${baseY + py * w} ${baseX - px * w},${baseY - py * w}`}
        fill={color}
      />
    </g>
  );
}

/* ----------------------------- helpers ---------------------------- */

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

interface Piece {
  square: string;
  type: string; // lowercase k/q/r/b/n/p
  color: "w" | "b";
}

function parseFen(fen: string): Piece[] {
  const placement = fen.split(" ")[0];
  const ranks = placement.split("/");
  const out: Piece[] = [];
  for (let r = 0; r < 8; r++) {
    const rankStr = ranks[r];
    if (!rankStr) continue;
    let file = 0;
    for (const ch of rankStr) {
      if (/\d/.test(ch)) {
        file += Number(ch);
      } else {
        const square = `${FILES[file]}${8 - r}`;
        out.push({
          square,
          type: ch.toLowerCase(),
          color: ch === ch.toUpperCase() ? "w" : "b",
        });
        file += 1;
      }
    }
  }
  return out;
}

/** top-left (x,y) of a square in board units, honoring orientation */
function sqXY(square: string, orientation: Orientation): { x: number; y: number } {
  const f = square.charCodeAt(0) - 97; // a=0
  const r = Number(square[1]) - 1; // rank1=0
  if (orientation === "white") {
    return { x: f, y: 7 - r };
  }
  return { x: 7 - f, y: r };
}
