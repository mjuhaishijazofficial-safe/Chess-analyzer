"use client";

import { useEffect, useState } from "react";
import { getPieceSet } from "@/lib/piece-set";
import { getBoardTheme, type BoardTheme } from "@/lib/board-theme";
import type { Classification } from "@/lib/chess-review";

type Orientation = "white" | "black";

const BADGE: Record<Classification, { color: string; symbol: string }> = {
  brilliant: { color: "#26c2a3", symbol: "!!" },
  great: { color: "#5b9bd5", symbol: "!" },
  best: { color: "#81b64c", symbol: "★" },
  excellent: { color: "#81b64c", symbol: "✓" },
  good: { color: "#95b776", symbol: "✓" },
  book: { color: "#a88865", symbol: "📖" },
  inaccuracy: { color: "#f7c631", symbol: "?!" },
  miss: { color: "#fa412d", symbol: "✗" },
  mistake: { color: "#e58f2a", symbol: "?" },
  blunder: { color: "#fa412d", symbol: "??" },
  forced: { color: "#9aa0a6", symbol: "□" },
};

const PIECE_CODE: Record<string, string> = { k: "K", q: "Q", r: "R", b: "B", n: "N", p: "P" };

export function pieceImageUrl(type: string, color: "w" | "b", set: string): string {
  return `https://lichess1.org/assets/piece/${set}/${color}${PIECE_CODE[type]}.svg`;
}

const DEFAULT_LIGHT = "#7d8694";
const DEFAULT_DARK = "#454b55";

interface BoardProps {
  fen: string;
  orientation?: Orientation;
  lastMove?: { from: string; to: string } | null;
  arrow?: { from: string; to: string } | null;
  checkSquare?: string | null;
  badge?: { square: string; classification: Classification } | null;
  onSquareClick?: (square: string) => void;
  selectedSquare?: string | null;
  legalMoves?: string[];
  /** Override the saved theme (e.g. for a live settings preview) instead of reading localStorage. */
  themeOverride?: BoardTheme;
  /** Override the saved piece set (e.g. for a live settings preview) instead of reading localStorage. */
  pieceSetOverride?: string;
}

export function Board({
  fen,
  orientation = "white",
  lastMove,
  arrow,
  checkSquare,
  badge,
  onSquareClick,
  selectedSquare,
  legalMoves,
  themeOverride,
  pieceSetOverride,
}: BoardProps) {
  const pieces = parseFen(fen);
  const [pieceSet, setPieceSetState] = useState(pieceSetOverride ?? "cburnett");
  const [theme, setTheme] = useState<BoardTheme>(
    themeOverride ?? {
      name: "slate",
      light: DEFAULT_LIGHT,
      dark: DEFAULT_DARK,
    },
  );

  useEffect(() => {
    if (pieceSetOverride === undefined) setPieceSetState(getPieceSet());
    if (themeOverride === undefined) setTheme(getBoardTheme());
  }, [pieceSetOverride, themeOverride]);

  useEffect(() => {
    if (pieceSetOverride !== undefined) setPieceSetState(pieceSetOverride);
  }, [pieceSetOverride]);

  useEffect(() => {
    if (themeOverride !== undefined) setTheme(themeOverride);
  }, [themeOverride]);

  return (
    <svg
      viewBox="0 0 8 8"
      className="aspect-square w-full select-none rounded-xl border border-line shadow-xl shadow-black/30"
    >
      <defs>
        <radialGradient id="check-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,0,0,0.9)" />
          <stop offset="25%" stopColor="rgba(255,0,0,0.65)" />
          <stop offset="60%" stopColor="rgba(255,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(255,0,0,0)" />
        </radialGradient>
      </defs>
      {/* squares */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((__, col) => {
          const light = (row + col) % 2 === 0;
          const file = orientation === "white" ? FILES[col] : FILES[7 - col];
          const rank = orientation === "white" ? 8 - row : row + 1;
          const square = `${file}${rank}`;
          return (
            <rect
              key={`${row}-${col}`}
              x={col}
              y={row}
              width={1}
              height={1}
              fill={light ? theme.light : theme.dark}
              onClick={onSquareClick ? () => onSquareClick(square) : undefined}
              style={onSquareClick ? { cursor: "pointer" } : undefined}
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
              style={{ pointerEvents: "none" }}
            />
          );
        })}

      {/* selected-square highlight */}
      {selectedSquare &&
        (() => {
          const { x, y } = sqXY(selectedSquare, orientation);
          return (
            <rect
              x={x}
              y={y}
              width={1}
              height={1}
              fill="rgba(255,215,0,0.35)"
              style={{ pointerEvents: "none" }}
            />
          );
        })()}

      {/* check highlight — pulsing red radial glow on the king in danger */}
      {checkSquare &&
        (() => {
          const { x, y } = sqXY(checkSquare, orientation);
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={x - 0.5}
                y={y - 0.5}
                width={2}
                height={2}
                fill="url(#check-glow)"
              >
                <animate
                  attributeName="opacity"
                  values="0.55;1;0.55"
                  dur="1.1s"
                  repeatCount="indefinite"
                />
              </rect>
            </g>
          );
        })()}

      {/* legal move indicators — ring around capturable pieces, dot on empty squares */}
      {legalMoves &&
        Array.from(new Set(legalMoves)).map((sq) => {
          const { x, y } = sqXY(sq, orientation);
          const isCapture = pieces.some((p) => p.square === sq);
          return isCapture ? (
            <circle
              key={`legal-${sq}`}
              cx={x + 0.5}
              cy={y + 0.5}
              r={0.44}
              fill="none"
              stroke="rgba(129,182,76,0.85)"
              strokeWidth={0.07}
              style={{ pointerEvents: "none" }}
            />
          ) : (
            <circle
              key={`legal-${sq}`}
              cx={x + 0.5}
              cy={y + 0.5}
              r={0.16}
              fill="rgba(129,182,76,0.75)"
              style={{ pointerEvents: "none" }}
            />
          );
        })}

      {/* coordinate labels */}
      {Array.from({ length: 8 }).map((_, i) => {
        const file = orientation === "white" ? FILES[i] : FILES[7 - i];
        const rank = orientation === "white" ? 8 - i : i + 1;
        return (
          <g key={`coord-${i}`} style={{ pointerEvents: "none" }}>
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
        return (
          <image
            key={p.square}
            href={pieceImageUrl(p.type, p.color, pieceSet)}
            x={x + 0.05}
            y={y + 0.05}
            width={0.9}
            height={0.9}
            style={{ pointerEvents: "none" }}
          />
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
  type: string;
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

function sqXY(square: string, orientation: Orientation): { x: number; y: number } {
  const f = square.charCodeAt(0) - 97;
  const r = Number(square[1]) - 1;
  if (orientation === "white") {
    return { x: f, y: 7 - r };
  }
  return { x: 7 - f, y: r };
}
