"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TimeClass } from "@/lib/chesscom";
import type { GameRow } from "@/lib/format";
import { TIME_CLASS_META } from "@/lib/format";

const HEIGHT = 240;
const PAD = { top: 24, right: 16, bottom: 24, left: 40 };

export function RatingChart({ rows }: { rows: GameRow[] }) {
  // which time classes have at least 2 points
  const classes = useMemo(() => {
    const counts = new Map<TimeClass, number>();
    for (const r of rows) counts.set(r.timeClass, (counts.get(r.timeClass) ?? 0) + 1);
    return (["bullet", "blitz", "rapid", "daily"] as TimeClass[]).filter(
      (tc) => (counts.get(tc) ?? 0) >= 2,
    );
  }, [rows]);

  const [active, setActive] = useState<TimeClass | null>(null);
  const selected = active ?? classes[0] ?? null;

  // chronological series for the selected class
  const series = useMemo(() => {
    if (!selected) return [];
    return rows
      .filter((r) => r.timeClass === selected)
      .slice()
      .sort((a, b) => a.endTime - b.endTime);
  }, [rows, selected]);

  if (classes.length === 0) {
    return (
      <div className="panel rounded-2xl p-6">
        <p className="text-sm text-muted">
          Not enough recent rated games to plot a rating trend.
        </p>
      </div>
    );
  }

  const first = series[0]?.myRating;
  const last = series[series.length - 1]?.myRating;
  const delta = first != null && last != null ? last - first : 0;

  return (
    <div className="panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{last}</span>
            <span
              className={`font-mono text-sm ${
                delta > 0 ? "text-accent" : delta < 0 ? "text-rose" : "text-faint"
              }`}
            >
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta)}
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-faint">
            {TIME_CLASS_META[selected!].label} · last {series.length} games
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {classes.map((tc) => (
            <button
              key={tc}
              onClick={() => setActive(tc)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                tc === selected
                  ? "bg-accent text-black"
                  : "border border-line bg-panel text-muted hover:text-fg"
              }`}
            >
              {TIME_CLASS_META[tc].label}
            </button>
          ))}
        </div>
      </div>

      <Plot series={series} />
    </div>
  );
}

function Plot({ series }: { series: GameRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { points, path, area, min, max } = useMemo(() => {
    const ratings = series.map((s) => s.myRating);
    const lo = Math.min(...ratings);
    const hi = Math.max(...ratings);
    const span = hi - lo || 1;
    const padY = Math.max(8, span * 0.15);
    const yMin = lo - padY;
    const yMax = hi + padY;

    const innerW = Math.max(1, width - PAD.left - PAD.right);
    const innerH = HEIGHT - PAD.top - PAD.bottom;

    const xs = (i: number) =>
      PAD.left +
      (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
    const ys = (v: number) =>
      PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

    const pts = series.map((s, i) => ({ x: xs(i), y: ys(s.myRating), d: s }));
    const line = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    const areaPath =
      pts.length > 0
        ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${HEIGHT - PAD.bottom} L ${pts[0].x.toFixed(1)} ${HEIGHT - PAD.bottom} Z`
        : "";

    return { points: pts, path: line, area: areaPath, min: lo, max: hi };
  }, [series, width]);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHover(nearest);
  }

  const hp = hover != null ? points[hover] : null;

  return (
    <div ref={ref} className="relative mt-5 w-full">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block touch-none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="ratingArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(74,222,128,0.28)" />
            <stop offset="100%" stopColor="rgba(74,222,128,0)" />
          </linearGradient>
        </defs>

        {/* gridlines for min/max */}
        {[max, min].map((v, i) => {
          const y =
            PAD.top +
            (HEIGHT - PAD.top - PAD.bottom) * (i === 0 ? 0.1 : 0.9);
          return (
            <g key={v + "-" + i}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 4"
              />
              <text
                x={PAD.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-faint font-mono"
                fontSize="10"
              >
                {v}
              </text>
            </g>
          );
        })}

        <path d={area} fill="url(#ratingArea)" />
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 4 : 2.5}
            className={
              p.d.outcome === "win"
                ? "fill-accent"
                : p.d.outcome === "loss"
                  ? "fill-rose"
                  : "fill-faint"
            }
          />
        ))}

        {/* hover guide */}
        {hp && (
          <line
            x1={hp.x}
            x2={hp.x}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            stroke="rgba(255,255,255,0.18)"
          />
        )}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs shadow-xl"
          style={{
            left: Math.min(Math.max(hp.x, 70), width - 70),
            top: 0,
          }}
        >
          <div className="font-semibold tabular-nums text-fg">
            {hp.d.myRating}
          </div>
          <div className="mt-0.5 font-mono text-faint">
            <span
              className={
                hp.d.outcome === "win"
                  ? "text-accent"
                  : hp.d.outcome === "loss"
                    ? "text-rose"
                    : "text-muted"
              }
            >
              {hp.d.outcome.toUpperCase()}
            </span>{" "}
            vs {hp.d.oppName}
          </div>
        </div>
      )}
    </div>
  );
}
