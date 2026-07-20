"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Game } from "@/lib/chesscom";
import type { GameRow, Outcome } from "@/lib/format";
import { TIME_CLASS_META } from "@/lib/format";
import { TimeAgo } from "@/components/time-ago";
import type { BiggestWin, BestStreak } from "@/lib/journey";
import type { OpeningStat } from "@/lib/opening-breakdown";
import { Engine } from "@/lib/engine";
import { analyzeGameMoves } from "@/lib/analyze-game";
import { aggregateBlunders, type BlunderReport, type Phase } from "@/lib/blunder-stats";
import { RatingChart } from "@/components/rating-chart";

type Platform = "chesscom" | "lichess";

interface Ratings {
  bullet?: number;
  blitz?: number;
  rapid?: number;
  daily?: number;
}

interface JourneyTimelineProps {
  username: string;
  platform: Platform;
  title?: string;
  startedPlaying: string;
  ratings: Ratings;
  biggestWin: BiggestWin | null;
  bestStreak: BestStreak;
  tally: Record<Outcome, number>;
  favoriteOpening: OpeningStat | null;
  nextGoal: number | null;
  currentRating: number | null;
  rows: GameRow[];
  games: Game[];
}

const PHASE_LABEL: Record<Phase, string> = {
  opening: "the opening",
  middlegame: "the middlegame",
  endgame: "the endgame",
};

type BlunderScanState = "loading" | "done" | "unavailable";

export function JourneyTimeline({
  username,
  platform,
  title,
  startedPlaying,
  ratings,
  biggestWin,
  bestStreak,
  tally,
  favoriteOpening,
  nextGoal,
  currentRating,
  rows,
  games,
}: JourneyTimelineProps) {
  const [scanState, setScanState] = useState<BlunderScanState>("loading");
  const [report, setReport] = useState<BlunderReport | null>(null);
  const [downloading, setDownloading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const withPgn = games.filter((g) => !!g.pgn && g.rules === "chess").slice(0, 3);
      if (withPgn.length === 0) {
        if (!cancelled) setScanState("unavailable");
        return;
      }
      try {
        const engine = new Engine();
        await engine.whenReady;
        if (cancelled) return;
        const quickMovetime = engine.multiThreaded ? 90 : 150;
        const refineMovetime = engine.multiThreaded ? 500 : 900;

        const analyzed: { url: string; playerColor: "w" | "b"; moves: Awaited<ReturnType<typeof analyzeGameMoves>> }[] = [];
        for (const g of withPgn) {
          if (cancelled) return;
          const playerColor: "w" | "b" =
            g.white.username.toLowerCase() === username.toLowerCase() ? "w" : "b";
          const moves = await analyzeGameMoves(g.pgn!, engine, { quickMovetime, refineMovetime });
          analyzed.push({ url: g.url, playerColor, moves });
        }
        engine.destroy?.();
        if (cancelled) return;
        setReport(aggregateBlunders(analyzed));
        setScanState("done");
      } catch {
        if (!cancelled) setScanState("unavailable");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const worstBlunder = report?.samples[0] ?? null;

  const advice = (() => {
    if (!report) return null;
    const entries = (Object.keys(report.byPhase) as Phase[]).map((p) => ({
      phase: p,
      count: report.byPhase[p].mistakes + report.byPhase[p].blunders,
    }));
    const worst = entries.sort((a, b) => b.count - a.count)[0];
    if (!worst || worst.count === 0) {
      return "Your recent games show very few mistakes — keep it up, and keep challenging yourself with tougher opponents.";
    }
    return `You lose the most points in ${PHASE_LABEL[worst.phase]} — spend extra study time there and it'll show up fast in your rating.`;
  })();

  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function downloadImage() {
    if (!captureRef.current) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const dataUrl = await toPng(captureRef.current, { pixelRatio: 2, backgroundColor: "#0b0e13" });
      const link = document.createElement("a");
      link.download = `chessdeeper-journey-${username.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[journey] download failed:", err);
      setDownloadError(err instanceof Error ? err.message : "Download failed — see console for details.");
    } finally {
      setDownloading(false);
    }
  }

  const siteName = platform === "lichess" ? "Lichess" : "Chess.com";
  const totalGames = tally.win + tally.draw + tally.loss;
  const winRate = totalGames ? Math.round((tally.win / totalGames) * 100) : null;

  const ratingEntries = (["bullet", "blitz", "rapid", "daily"] as const)
    .map((k) => ({ k, v: ratings[k] }))
    .filter((r) => r.v != null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <a href="/journey" className="font-mono text-xs text-muted hover:text-fg">
          ← new journey
        </a>
        <button
          onClick={downloadImage}
          disabled={downloading}
          className="ring-focus inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
        >
          {downloading ? "Saving…" : "📥 Download as image"}
        </button>
      </div>

      {downloadError && (
        <p className="-mt-4 mb-4 text-center text-sm text-rose">{downloadError}</p>
      )}

      <div ref={captureRef} className="rounded-3xl border border-line bg-[#0b0e13] p-6 sm:p-8">
        {/* header */}
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-2xl">♞</span>
            <span className="font-mono text-sm font-bold tracking-wide text-fg">
              chess<span className="text-accent">deeper
</span>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            {title && <span className="mr-2 text-amber">{title}</span>}
            @{username}&apos;s Chess Journey
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-faint">
            {siteName} · started {startedPlaying}
          </p>
        </div>

        {/* tile grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Tile icon="📈" label="Current rating">
            {ratingEntries.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {ratingEntries.map(({ k, v }) => (
                  <span key={k} className="inline-flex items-baseline gap-1.5">
                    <span className="text-xs text-faint">{TIME_CLASS_META[k].icon}</span>
                    <span className="font-mono text-lg font-bold text-fg">{v}</span>
                  </span>
                ))}
              </div>
            ) : (
              <Empty text="No rated games yet." />
            )}
          </Tile>

          <Tile icon="🎯" label="Next goal">
            {nextGoal != null ? (
              <div className="font-mono text-lg font-bold text-fg">{nextGoal} rating</div>
            ) : (
              <Empty text="Play a rated game to set a goal." />
            )}
          </Tile>

          <Tile icon="🏆" label="Biggest win">
            {biggestWin ? (
              <div>
                <div className="font-mono text-lg font-bold text-fg">
                  beat {biggestWin.opponentName} ({biggestWin.opponentRating})
                </div>
                <div className="mt-0.5 text-xs text-faint"><TimeAgo unix={biggestWin.endTime} /></div>
              </div>
            ) : (
              <Empty text="No wins in your recent games sample." />
            )}
          </Tile>

          <Tile icon="🔥" label="Best streak">
            {bestStreak.length > 0 ? (
              <div className="font-mono text-lg font-bold text-fg">
                {bestStreak.length} win{bestStreak.length === 1 ? "" : "s"} in a row
                {bestStreak.current && (
                  <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                    ongoing
                  </span>
                )}
              </div>
            ) : (
              <Empty text="No streak yet — every journey starts somewhere." />
            )}
          </Tile>

          <Tile icon="👑" label="Favorite opening">
            {favoriteOpening ? (
              <div>
                <div className="font-mono text-lg font-bold text-fg">{favoriteOpening.label}</div>
                <div className="mt-0.5 text-xs text-faint">
                  {favoriteOpening.games} games · {favoriteOpening.winRate}% win rate
                </div>
              </div>
            ) : (
              <Empty text="Not enough repeated openings yet." />
            )}
          </Tile>

          <Tile icon="💥" label="Worst blunder">
            {scanState === "loading" && <Loading text="Scanning your games…" />}
            {scanState === "unavailable" && <Empty text="Couldn't analyze recent games." />}
            {scanState === "done" &&
              (worstBlunder ? (
                <div>
                  <div className="font-mono text-lg font-bold text-rose">
                    {worstBlunder.moveNo}. {worstBlunder.san}
                  </div>
                  <div className="mt-0.5 text-xs text-faint">
                    {worstBlunder.bestSan ? `best was ${worstBlunder.bestSan} · ` : ""}
                    -{Math.round(worstBlunder.winDrop)}cp
                  </div>
                </div>
              ) : (
                <Empty text="No major blunders found — nicely played." />
              ))}
          </Tile>
        </div>

        {/* record strip */}
        {totalGames > 0 && (
          <div className="mt-4 rounded-2xl border border-line bg-panel/60 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
                recent record
              </span>
              {winRate != null && (
                <span className="font-mono text-sm font-semibold text-accent">
                  {winRate}% win
                </span>
              )}
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-panel-2">
              <span style={{ width: `${(tally.win / totalGames) * 100}%` }} className="bg-accent" />
              <span style={{ width: `${(tally.draw / totalGames) * 100}%` }} className="bg-faint" />
              <span style={{ width: `${(tally.loss / totalGames) * 100}%` }} className="bg-rose" />
            </div>
            <div className="mt-1.5 font-mono text-xs text-muted">
              {tally.win}W {tally.draw}D {tally.loss}L
            </div>
          </div>
        )}

        {/* trend chart */}
        {rows.length > 0 && (
          <div className="mt-4 rounded-2xl border border-line bg-panel/60 p-4">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
              recent trend
            </div>
            <RatingChart rows={rows} />
          </div>
        )}

        {/* advice */}
        <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent">
            <span>🤖</span> coach&apos;s advice
          </div>
          {scanState === "loading" ? (
            <Loading text="Working out your next step…" />
          ) : (
            <p className="text-sm leading-relaxed text-fg">{advice}</p>
          )}
        </div>

        <div className="mt-6 text-center font-mono text-[11px] text-faint">
          chessdeeper.app/journey · {siteName}
        </div>
      </div>
    </div>
  );
}

function Tile({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-4">
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-faint">
        <span>{icon}</span> {label}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-faint">{text}</p>;
}

function Loading({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted">
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
      {text}
    </p>
  );
}
