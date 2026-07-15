"use client";

import { useRef, useState } from "react";
import { Engine } from "@/lib/engine";
import { analyzeGameMoves } from "@/lib/analyze-game";
import { aggregateBlunders, type BlunderReport, type BlunderSample, type Phase } from "@/lib/blunder-stats";
import { savePuzzle } from "@/lib/puzzle-store";
import { GameReview } from "@/components/game-review";

const GAME_LIMIT = 3;

interface GameApiRow {
  uuid: string | null;
  url: string;
  pgn: string;
  time_class: string;
  end_time: number;
  white: string;
  black: string;
}

type Status = "idle" | "loading-games" | "analyzing" | "done" | "error";
type Stage = "scan" | "refine";

const PHASE_LABEL: Record<Phase, string> = {
  opening: "Opening",
  middlegame: "Middlegame",
  endgame: "Endgame",
};

function sampleKey(s: BlunderSample) {
  return `${s.gameIndex}-${s.ply}`;
}

export function BlunderReportCard() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({
    game: 0,
    totalGames: 0,
    stage: "scan" as Stage,
    stageDone: 0,
    stageTotal: 0,
  });
  const [report, setReport] = useState<BlunderReport | null>(null);
  const [games, setGames] = useState<GameApiRow[]>([]);
  const [cleanUsername, setCleanUsername] = useState("");
  const [selected, setSelected] = useState<{ gameIndex: number; ply: number } | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const cancelRef = useRef(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const clean = username.trim().toLowerCase();
    if (!clean) return;

    cancelRef.current = false;
    setStatus("loading-games");
    setError(null);
    setReport(null);
    setSelected(null);
    setSavedKeys(new Set());
    setCleanUsername(clean);

    try {
      const res = await fetch(`/api/games/${encodeURIComponent(clean)}?limit=${GAME_LIMIT}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Could not load games.");
      const fetchedGames: GameApiRow[] = data.games;
      if (fetchedGames.length === 0) {
        setError("No recent rated games with a PGN were found for this player.");
        setStatus("error");
        return;
      }
      setGames(fetchedGames);

      setStatus("analyzing");
      setProgress({ game: 0, totalGames: fetchedGames.length, stage: "scan", stageDone: 0, stageTotal: 0 });

      const engine = new Engine();
      await engine.whenReady;
      // Pass 1 is a quick scan of every position; pass 2 only re-checks the
      // handful of moves the scan flagged, so it can afford a much deeper
      // search without blowing up total analysis time.
      const quickMovetime = engine.multiThreaded ? 90 : 150;
      const refineMovetime = engine.multiThreaded ? 500 : 900;

      const analyzed: { url: string; playerColor: "w" | "b"; moves: Awaited<ReturnType<typeof analyzeGameMoves>> }[] = [];

      for (let i = 0; i < fetchedGames.length; i++) {
        if (cancelRef.current) return;
        const g = fetchedGames[i];
        const playerColor: "w" | "b" = g.white.toLowerCase() === clean ? "w" : "b";
        const moves = await analyzeGameMoves(g.pgn, engine, {
          quickMovetime,
          refineMovetime,
          onProgress: (done, total, stage) => {
            setProgress({ game: i + 1, totalGames: fetchedGames.length, stage, stageDone: done, stageTotal: total });
          },
        });
        analyzed.push({ url: g.url, playerColor, moves });
        setProgress((p) => ({ ...p, game: i + 1 }));
      }

      engine.destroy?.();
      setReport(aggregateBlunders(analyzed));
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function saveSample(s: BlunderSample) {
    if (!s.bestUci || !s.bestSan) return;
    const game = games[s.gameIndex];
    if (!game) return;
    savePuzzle({
      id: `blunder-${cleanUsername}-${sampleKey(s)}`,
      fen: s.fen,
      bestMove: s.bestUci,
      bestMoveSan: s.bestSan,
      playerMove: s.playerUci,
      playerMoveSan: s.san,
      classification: s.winDrop >= 20 ? "blunder" : "mistake",
      whiteName: game.white,
      blackName: game.black,
      savedAt: Date.now(),
    });
    setSavedKeys((prev) => new Set(prev).add(sampleKey(s)));
  }

  function saveAll() {
    if (!report) return;
    for (const s of report.samples) {
      if (!savedKeys.has(sampleKey(s)) && s.bestUci) saveSample(s);
    }
  }

  const busy = status === "loading-games" || status === "analyzing";
  const saveableSamples = report?.samples.filter((s) => !!s.bestUci) ?? [];
  const unsavedCount = saveableSamples.filter((s) => !savedKeys.has(sampleKey(s))).length;

  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="mx-auto max-w-2xl">
        <div className="mb-1 text-sm font-medium text-fg">Blunder pattern report</div>
        <p className="mb-4 text-sm text-muted">
          Analyzes your last {GAME_LIMIT} games move-by-move and shows which phase of the game — opening,
          middlegame, or endgame — your mistakes and blunders actually happen in. Every move gets a quick
          scan first, then anything that looks like a mistake or blunder gets a much deeper second look.
          Turn any of them into a puzzle to drill later on the{" "}
          <a href="/puzzles" className="text-accent underline underline-offset-2">
            My Puzzles
          </a>{" "}
          page.
        </p>

        <form onSubmit={run} className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-chess-com-username"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            disabled={busy}
            className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-faint outline-none focus:border-line-strong"
          />
          <button
            type="submit"
            disabled={busy || !username.trim()}
            className="rounded-lg border border-line bg-panel-2 px-4 py-2 text-sm text-fg transition hover:border-line-strong disabled:opacity-50"
          >
            {busy ? "Analyzing…" : "Analyze"}
          </button>
        </form>

        {status === "loading-games" && (
          <p className="mt-4 text-sm text-muted">Fetching recent games…</p>
        )}

        {status === "analyzing" && (
          <div className="mt-4">
            <p className="text-sm text-muted">
              Game {progress.game} of {progress.totalGames} —{" "}
              {progress.stage === "scan"
                ? `scanning move ${progress.stageDone} of ${progress.stageTotal}…`
                : progress.stageTotal > 0
                  ? `double-checking risky move ${progress.stageDone} of ${progress.stageTotal}…`
                  : "no risky moves to double-check, moving on…"}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full bg-accent/70 transition-all"
                style={{
                  width:
                    progress.stageTotal > 0
                      ? `${Math.round((progress.stageDone / progress.stageTotal) * 100)}%`
                      : "100%",
                }}
              />
            </div>
          </div>
        )}

        {status === "error" && error && (
          <p className="mt-4 text-sm text-rose">{error}</p>
        )}

        {status === "done" && report && (
          <div className="mt-5">
            <p className="mb-3 text-xs text-faint">
              {report.movesAnalyzed} of your moves analyzed across {report.gamesAnalyzed} games.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(report.byPhase) as Phase[]).map((phase) => {
                const { mistakes, blunders } = report.byPhase[phase];
                return (
                  <div key={phase} className="rounded-lg border border-line bg-bg p-3">
                    <div className="text-xs text-muted">{PHASE_LABEL[phase]}</div>
                    <div className="mt-1 text-xl font-semibold text-fg">{mistakes + blunders}</div>
                    <div className="mt-0.5 text-xs text-faint">
                      {blunders} blunder{blunders === 1 ? "" : "s"}, {mistakes} mistake{mistakes === 1 ? "" : "s"}
                    </div>
                  </div>
                );
              })}
            </div>

            {report.samples.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs text-muted">Worst moves found — click one to open the full review</div>
                  {saveableSamples.length > 0 && (
                    <button
                      onClick={saveAll}
                      disabled={unsavedCount === 0}
                      className="rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/15 disabled:cursor-default disabled:opacity-50"
                    >
                      {unsavedCount === 0 ? "All saved ✓" : `Save all ${unsavedCount} as puzzles`}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {report.samples.map((s, i) => {
                    const key = sampleKey(s);
                    const isSaved = savedKeys.has(key);
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
                          selected?.gameIndex === s.gameIndex && selected.ply === s.ply
                            ? "border-accent text-accent"
                            : "border-line text-muted"
                        }`}
                      >
                        <button
                          onClick={() => setSelected({ gameIndex: s.gameIndex, ply: s.ply })}
                          className="flex flex-1 items-center justify-between text-left hover:text-fg"
                        >
                          <span>
                            {s.moveNo}. {s.san}
                            {s.bestSan ? ` (best was ${s.bestSan})` : ""} — {PHASE_LABEL[s.phase]}
                          </span>
                          <span className="ml-2 shrink-0 text-rose">-{Math.round(s.winDrop)}cp</span>
                        </button>
                        {s.bestUci && (
                          <button
                            onClick={() => saveSample(s)}
                            disabled={isSaved}
                            title={isSaved ? "Saved to My Puzzles" : "Save as puzzle"}
                            className={`shrink-0 rounded-md px-2 py-1 font-medium transition ${
                              isSaved
                                ? "bg-accent/15 text-accent"
                                : "bg-panel-2 text-muted hover:text-fg"
                            }`}
                          >
                            {isSaved ? "✓ Saved" : "+ Puzzle"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {status === "done" && selected && games[selected.gameIndex] && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-fg">
              Full review — {games[selected.gameIndex].white} vs {games[selected.gameIndex].black}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:border-line-strong hover:text-fg"
            >
              Close
            </button>
          </div>
          <GameReview
            key={`${selected.gameIndex}-${selected.ply}`}
            pgn={games[selected.gameIndex].pgn}
            whiteName={games[selected.gameIndex].white}
            blackName={games[selected.gameIndex].black}
            playerColor={games[selected.gameIndex].white.toLowerCase() === cleanUsername ? "white" : "black"}
            result={null}
            initialPly={selected.ply}
          />
        </div>
      )}
    </div>
  );
}
