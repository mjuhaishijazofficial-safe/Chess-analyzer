"use client";

import { bookPlies, matchOpeningName } from "@/lib/opening-book";
import { savePuzzle } from "@/lib/puzzle-store";
import { getAnalysisDepth, reviewMovetimeFor, puzzleMovetimeFor } from "@/lib/analysis-depth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Chess } from "chess.js";
import { Board } from "./board";
import { EvalBar } from "./eval-bar";
import { MoveList } from "./move-list";
import { CoachCard } from "./coach-card";
import { ShareCard, type ShareCardData } from "./share-card";
import { Engine } from "@/lib/engine";
import { coachReview, detectMotifs } from "@/lib/coach";
import { speak, stopSpeaking, isTtsSupported } from "@/lib/tts";
import { playSoundForSan } from "@/lib/sound";
import { explainMove, legalTargetsFrom, toUci, type ExploreResult } from "@/lib/explore";
import {
  CLASS_META,
  classifyMove,
  cpStm,
  material,
  summarize,
  type Classification,
  type MoveReview,
} from "@/lib/chess-review";

type EngineState = "loading" | "running" | "done" | "unavailable";

interface EngineInfo {
  multiThreaded: boolean;
  threads: number;
}

interface Props {
  pgn: string;
  whiteName: string;
  blackName: string;
  playerColor: "white" | "black";
  result: string | null;
  initialPly?: number;
  /** Optional — shown as a small badge on the share card when provided. */
  platform?: "chesscom" | "lichess";
}

export function GameReview({
  pgn,
  whiteName,
  blackName,
  playerColor,
  result,
  initialPly = 0,
  platform,
}: Props) {
  const parsed = useMemo(() => parsePgn(pgn), [pgn]);
  const [moves, setMoves] = useState<MoveReview[]>(parsed.moves);
  const [startEval, setStartEval] = useState<number | null>(null);
  const [ply, setPly] = useState(() => Math.max(0, Math.min(initialPly, parsed.moves.length)));
  const [orientation, setOrientation] = useState<"white" | "black">(playerColor);
  const [showArrows, setShowArrows] = useState(true);
  const [engineState, setEngineState] = useState<EngineState>("loading");
  const [engineInfo, setEngineInfo] = useState<EngineInfo | null>(null);
  const [depthSeen, setDepthSeen] = useState(0);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [voiceOn, setVoiceOn] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  useEffect(() => {
    setTtsSupported(isTtsSupported());
  }, []);

  /* ------------------- "Why not X?" explore mode --------------------- */
  const [exploreOn, setExploreOn] = useState(false);
  const [exploreSelected, setExploreSelected] = useState<string | null>(null);
  const [exploreTargets, setExploreTargets] = useState<string[]>([]);
  const [exploreResult, setExploreResult] = useState<ExploreResult | null>(null);
  const [exploreLoading, setExploreLoading] = useState(false);
  const exploreEngineRef = useRef<Engine | null>(null);

  useEffect(() => {
    return () => {
      exploreEngineRef.current?.destroy();
      exploreEngineRef.current = null;
    };
  }, []);

  const resetExploreSelection = useCallback(() => {
    setExploreSelected(null);
    setExploreTargets([]);
  }, []);

  const handleExploreClick = useCallback(
    async (square: string, currentFen: string, currentPly: number) => {
      if (!exploreSelected) {
        const targets = legalTargetsFrom(currentFen, square);
        if (targets.length) {
          setExploreSelected(square);
          setExploreTargets(targets);
          setExploreResult(null);
        }
        return;
      }
      if (square === exploreSelected) {
        resetExploreSelection();
        return;
      }
      if (exploreTargets.includes(square)) {
        const uci = toUci(currentFen, exploreSelected, square);
        resetExploreSelection();
        if (!uci) return;
        setExploreLoading(true);
        setExploreResult(null);
        try {
          if (!exploreEngineRef.current) exploreEngineRef.current = new Engine();
          const engine = exploreEngineRef.current;
          await engine.whenReady;
          const result = await explainMove(engine, currentFen, uci, currentPly);
          setExploreResult(result);
        } catch {
          setExploreResult(null);
        } finally {
          setExploreLoading(false);
        }
        return;
      }
      // clicked a different own piece — reselect
      const targets = legalTargetsFrom(currentFen, square);
      if (targets.length) {
        setExploreSelected(square);
        setExploreTargets(targets);
        setExploreResult(null);
      } else {
        resetExploreSelection();
      }
    },
    [exploreSelected, exploreTargets, resetExploreSelection],
  );

  // read the "why not X" explanation aloud too
  useEffect(() => {
    if (!voiceOn || exploreLoading || !exploreResult) return;
    speak(exploreResult.message);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploreResult, exploreLoading, voiceOn]);

  const N = parsed.moves.length;
  const myColor = playerColor === "white" ? "w" : "b";

  /* -------------------- deep refinement of current position ---------------------
   * The main scan below is intentionally fast (short movetime per position) so
   * the whole game reviews quickly. Once that's done, we separately run a
   * much deeper (depth 20) search on just the ONE position the person is
   * currently looking at — this is what Lichess/chess.com's own analysis
   * boards do too. It updates the best-move arrow and eval with a more
   * precise number without slowing down the initial pass. */
  interface DeepInfo {
    ply: number;
    depth: number;
    cpWhite: number;
    bestUci: string | null;
  }
  const [deepInfo, setDeepInfo] = useState<DeepInfo | null>(null);
  const [deepening, setDeepening] = useState(false);
  const deepEngineRef = useRef<Engine | null>(null);

  /* ------------------------- engine analysis ------------------------ */
  useEffect(() => {
    if (parsed.error || N === 0) {
      setEngineState("unavailable");
      return;
    }
    let cancelled = false;
    const engine = new Engine();
    const working = parsed.moves.map((m) => ({ ...m }));
    const posStm: number[] = [];
    const posSecond: (number | null)[] = [];
    const posBest: (string | null)[] = [];
    const posPv: string[][] = [];

    engine.whenReady
      .then(async () => {
        if (cancelled) return;
        const movetime = reviewMovetimeFor(getAnalysisDepth(), engine.multiThreaded);
        setEngineInfo({
          multiThreaded: engine.multiThreaded,
          threads: engine.threads,
        });
        setEngineState("running");
        const total = N + 1;
        setProgress({ done: 0, total });

        for (let k = 0; k <= N; k++) {
          if (cancelled) return;
          const fen = k === 0 ? parsed.startFen : working[k - 1].fenAfter;
          const whiteToMove = fen.split(" ")[1] === "w";

          const probe = new Chess(fen);
          let stm = 0;
          let second: number | null = null;
          let best: string | null = null;
          let pv: string[] = [];
          if (probe.isCheckmate()) {
            stm = -100000;
          } else if (probe.isStalemate() || probe.isDraw()) {
            stm = 0;
          } else {
            const ev = await engine.analyze(fen, { movetime });
            if (cancelled) return;
            stm = cpStm(ev.lines[0]);
            second = ev.lines[1] ? cpStm(ev.lines[1]) : null;
            best = ev.bestMove ?? ev.lines[0]?.move ?? null;
            pv = ev.lines[0]?.pv ?? [];
            if (ev.depth) setDepthSeen(ev.depth);
          }
          posStm[k] = stm;
          posSecond[k] = second;
          posBest[k] = best;
          posPv[k] = pv;

          const whiteCp = whiteToMove ? stm : -stm;
          if (k === 0) {
            setStartEval(whiteCp);
          } else {
            const mv = working[k - 1];
            mv.evalWhiteCp = whiteCp;

            const bUci = posBest[k - 1];
            const probeBefore = new Chess(mv.fenBefore);
            const legalCount = probeBefore.moves().length;

            const matBefore = material(mv.fenBefore, mv.color);
            const oppReply = posBest[k];
            let matAfter = material(mv.fenAfter, mv.color);
            if (oppReply) {
              try {
                const c = new Chess(mv.fenAfter);
                c.move({
                  from: oppReply.slice(0, 2),
                  to: oppReply.slice(2, 4),
                  promotion: oppReply.length > 4 ? oppReply[4] : undefined,
                });
                matAfter = material(c.fen(), mv.color);
              } catch {
                /* keep */
              }
            }
            const sacrifice = matBefore - matAfter;

           const sanSoFar = working.slice(0, k).map((m) => m.san);
const bookMatchPlies = bookPlies(sanSoFar);

const res = classifyMove({
  ply: mv.ply,
  playedUci: mv.uci,
  bestUci: bUci,
  bestCpStm: posStm[k - 1],
  secondCpStm: posSecond[k - 1],
  moverAfterCp: -stm,
  legalCount,
  sacrifice,
  bookMatchPlies,
});

            // motifs for coach commentary
            const playedMotifs = detectMotifs(mv.fenBefore, mv.uci);
            const bestMotifs = bUci ? detectMotifs(mv.fenBefore, bUci) : null;
            const replyMotifs = oppReply
              ? detectMotifs(mv.fenAfter, oppReply)
              : null;

            // upgrade to "miss" when a clear tactic was on offer
            let cls: Classification = res.classification;
            if (
              (cls === "mistake" || cls === "inaccuracy") &&
              bestMotifs &&
              (bestMotifs.fork ||
                bestMotifs.sacrifice ||
                (bestMotifs.capture && bestMotifs.capturedValue >= 2) ||
                (!!bestMotifs.threatPiece && res.winDrop >= 6))
            ) {
              cls = "miss";
            }

            const coach = coachReview({
              ply: mv.ply,
              san: mv.san,
              classification: cls,
              isPlayer: mv.color === myColor,
              bestSan: bUci ? uciToSan(mv.fenBefore, bUci) : null,
              played: playedMotifs,
              best: bestMotifs,
              reply: replyMotifs,
            });

            mv.bestUci = bUci;
            mv.bestSan = bUci ? uciToSan(mv.fenBefore, bUci) : null;
            mv.bestLineSan = pvToSan(mv.fenBefore, posPv[k - 1], 6);
            mv.classification = cls;
            mv.winDrop = res.winDrop;
            mv.accuracy = res.accuracy;
            mv.coachTitle = coach.title;
            mv.coachMessage = coach.message;
            mv.analyzed = true;
            setMoves(working.map((m) => ({ ...m })));
          }
          setProgress({ done: k + 1, total });
        }
        if (!cancelled) setEngineState("done");
      })
      .catch(() => {
        if (!cancelled) setEngineState("unavailable");
      });

    return () => {
      cancelled = true;
      engine.destroy();
    };
  }, [parsed, N, myColor]);

  /* current position for deep refinement — computed early so the effect
   * below can depend on it (declared again further down for rendering). */
  const currentFenForDeepen =
    ply === 0 ? parsed.startFen : moves[Math.min(ply, moves.length) - 1]?.fenAfter;

  useEffect(() => {
    if (engineState !== "done" || !currentFenForDeepen) return;
    let cancelled = false;
    setDeepening(true);

    async function run() {
      if (!deepEngineRef.current) deepEngineRef.current = new Engine();
      const engine = deepEngineRef.current;
      try {
        await engine.whenReady;
        if (cancelled) return;
        const movetime = puzzleMovetimeFor(getAnalysisDepth(), engine.multiThreaded);
        const ev = await engine.analyze(currentFenForDeepen!, { movetime, depth: 22 });
        if (cancelled) return;
        const whiteToMove = currentFenForDeepen!.split(" ")[1] === "w";
        const stm = cpStm(ev.lines[0]);
        setDeepInfo({
          ply,
          depth: ev.depth,
          cpWhite: whiteToMove ? stm : -stm,
          bestUci: ev.bestMove ?? ev.lines[0]?.move ?? null,
        });
      } catch {
        /* leave whatever the fast scan already produced */
      } finally {
        if (!cancelled) setDeepening(false);
      }
    }
    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, currentFenForDeepen, engineState]);

  useEffect(() => {
    return () => {
      deepEngineRef.current?.destroy();
      deepEngineRef.current = null;
    };
  }, []);

  /* --------------------------- navigation --------------------------- */
  const go = useCallback(
    (p: number) => {
      setPly(Math.max(0, Math.min(N, p)));
      setExploreResult(null);
      resetExploreSelection();
    },
    [N, resetExploreSelection],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(ply - 1);
      else if (e.key === "ArrowRight") go(ply + 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(N);
      else if (e.key.toLowerCase() === "f")
        setOrientation((o) => (o === "white" ? "black" : "white"));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ply, N, go]);

  /* ----------------------- derived current node --------------------- */
  const fen = ply === 0 ? parsed.startFen : moves[ply - 1].fenAfter;
  const lastMove =
    ply === 0
      ? null
      : {
          from: moves[ply - 1].uci.slice(0, 2),
          to: moves[ply - 1].uci.slice(2, 4),
        };
  const checkSquare = useMemo(() => checkSquareOf(fen), [fen]);
  const evalWhite = ply === 0 ? startEval : moves[ply - 1].evalWhiteCp;

  const playedMove = ply >= 1 ? moves[ply - 1] : null;

  const openingMatch = useMemo(() => {
    if (ply === 0) return null;
    const sanSoFar = moves.slice(0, ply).map((m) => m.san);
    return matchOpeningName(sanSoFar);
  }, [moves, ply]);

  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (playedMove?.san) playSoundForSan(playedMove.san);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply]);

  const forwardMove = moves[ply] ?? null;
  const deepMatchesPly = deepInfo?.ply === ply;
  const forwardBest = (deepMatchesPly ? deepInfo?.bestUci : null) ?? forwardMove?.bestUci ?? null;
  const arrow =
    showArrows && forwardBest
      ? { from: forwardBest.slice(0, 2), to: forwardBest.slice(2, 4) }
      : null;
  const displayEvalWhite = deepMatchesPly && deepInfo ? deepInfo.cpWhite : evalWhite;

  const badge =
    playedMove?.analyzed && playedMove.classification
      ? {
          square: playedMove.uci.slice(2, 4),
          classification: playedMove.classification,
        }
      : null;

  const summary = useMemo(() => summarize(moves), [moves]);

  /* ---------------------------- share card ---------------------------- */
  const shareCardData: ShareCardData = useMemo(() => {
    const me = playerColor === "white" ? summary.white : summary.black;
    const opp = playerColor === "white" ? summary.black : summary.white;
    const myName = playerColor === "white" ? whiteName : blackName;
    const oppName = playerColor === "white" ? blackName : whiteName;

    let resultLabel = "Game review";
    if (result === "1-0") resultLabel = playerColor === "white" ? "Won" : "Lost";
    else if (result === "0-1") resultLabel = playerColor === "white" ? "Lost" : "Won";
    else if (result) resultLabel = "Draw";

    return {
      playerName: myName,
      opponentName: oppName,
      accuracy: me.accuracy,
      opponentAccuracy: opp.accuracy,
      counts: me.counts,
      resultLabel,
      platform,
    };
  }, [summary, playerColor, whiteName, blackName, result, platform]);

  // coach card content
  const isMateEnd = !!playedMove?.san.includes("#");
  const evalBadge =
    ply === 0
      ? startEval != null
        ? formatEvalShort(startEval)
        : null
      : isMateEnd
        ? (result ?? formatEvalShort(displayEvalWhite ?? 0))
        : displayEvalWhite != null
          ? formatEvalShort(displayEvalWhite)
          : null;

  const thinking =
    ply >= 1 && !playedMove?.analyzed && engineState !== "unavailable";
  const coachTitle =
    ply === 0
      ? "Game Review"
      : (playedMove?.coachTitle ?? `${playedMove?.san}`);
  const coachMessage =
    ply === 0
      ? "Step through the game and I'll break down every move — the good, the bad, and the brilliant."
      : (playedMove?.coachMessage ?? "");

  // Speak the coach's commentary aloud whenever it changes (new move
  // selected, or analysis finishes). Skips the "Thinking…" state so we
  // never read that placeholder out loud.
  useEffect(() => {
    if (!voiceOn || thinking || !coachMessage) return;
    if (exploreOn && (exploreLoading || exploreResult)) return;
    speak(coachMessage);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachMessage, thinking, voiceOn, exploreOn, exploreLoading, exploreResult]);

  const showBest =
    !!playedMove?.analyzed &&
    !!playedMove.bestSan &&
    playedMove.bestUci !== playedMove.uci &&
    !!playedMove.classification &&
    !["forced", "book"].includes(playedMove.classification);

  if (parsed.error) {
    return (
      <div className="panel rounded-2xl p-6 text-sm text-muted">
        We couldn&apos;t parse this game&apos;s moves. It may use a non-standard
        format.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* board column */}
      <div>
        <PlayerTag
          name={orientation === "white" ? blackName : whiteName}
          color={orientation === "white" ? "black" : "white"}
          accuracy={
            orientation === "white"
              ? summary.black.accuracy
              : summary.white.accuracy
          }
        />
        <div className="my-2 flex items-stretch gap-3">
          <div className="w-6 shrink-0 sm:w-7">
            <EvalBar cpWhite={displayEvalWhite} orientation={orientation} />
          </div>
          <div className="min-w-0 flex-1">
            <Board
              fen={fen}
              orientation={orientation}
              lastMove={lastMove}
              arrow={arrow}
              checkSquare={checkSquare}
              badge={badge}
              onSquareClick={
                exploreOn
                  ? (square) => handleExploreClick(square, fen, ply)
                  : undefined
              }
              selectedSquare={exploreOn ? exploreSelected : null}
              legalMoves={exploreOn ? exploreTargets : undefined}
            />
          </div>
        </div>
        <PlayerTag
          name={orientation === "white" ? whiteName : blackName}
          color={orientation === "white" ? "white" : "black"}
          accuracy={
            orientation === "white"
              ? summary.white.accuracy
              : summary.black.accuracy
          }
        />

        <Controls
          ply={ply}
          total={N}
          onGo={go}
          orientation={orientation}
          onFlip={() =>
            setOrientation((o) => (o === "white" ? "black" : "white"))
          }
          showArrows={showArrows}
          onToggleArrows={() => setShowArrows((s) => !s)}
        />
      </div>

      {/* side column */}
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setExploreOn((v) => {
                const next = !v;
                resetExploreSelection();
                setExploreResult(null);
                if (!next) stopSpeaking();
                return next;
              });
            }}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              exploreOn
                ? "border-accent bg-accent/10 text-accent"
                : "border-line bg-panel text-muted hover:text-fg"
            }`}
            title="Click a piece, then a square, to ask why the coach would or wouldn't play it"
          >
            <span>🔍</span>
            {exploreOn ? "Exploring — pick a piece" : "Ask about a move"}
          </button>
          {ttsSupported && (
            <button
              type="button"
              onClick={() => {
                setVoiceOn((v) => {
                  const next = !v;
                  if (!next) stopSpeaking();
                  return next;
                });
              }}
              className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted hover:text-fg"
              title={voiceOn ? "Mute coach voice" : "Unmute coach voice"}
            >
              <span>{voiceOn ? "🔊" : "🔇"}</span>
              {voiceOn ? "Voice on" : "Voice off"}
            </button>
          )}
        </div>
        {exploreOn && (exploreLoading || exploreResult) ? (
          <div className="rounded-2xl border border-accent/40 bg-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                {exploreLoading ? (
                  <span className="inline-flex items-center gap-2 text-sm text-faint">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
                    Checking that move…
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-fg">
                    {exploreResult?.title}
                  </span>
                )}
              </div>
              {!exploreLoading && (
                <button
                  type="button"
                  onClick={() => setExploreResult(null)}
                  className="shrink-0 text-xs text-faint hover:text-fg"
                >
                  ← back to move review
                </button>
              )}
            </div>
            {!exploreLoading && exploreResult && (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {exploreResult.message}
              </p>
            )}
          </div>
        ) : (
          <CoachCard
            title={coachTitle}
            message={coachMessage}
            classification={ply === 0 ? null : (playedMove?.classification ?? null)}
            evalBadge={evalBadge}
            thinking={thinking}
            openingName={
              openingMatch && playedMove?.classification === "book"
                ? `${openingMatch.name} (${openingMatch.eco})`
                : null
            }
          />
        )}

        {engineState === "done" && (
          <div className="flex items-center gap-1.5 px-1 font-mono text-[11px] text-faint">
            {deepening && !deepMatchesPly ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
                refining this position to depth 20…
              </>
            ) : deepMatchesPly && deepInfo ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                verified at depth {deepInfo.depth}
              </>
            ) : null}
          </div>
        )}

        {engineState === "done" && (
          <button
            type="button"
            onClick={() => setShowShareCard(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-panel px-3 py-2.5 text-sm font-medium text-fg transition hover:border-accent/40 hover:text-accent"
          >
            <span>📤</span>
            Share result
          </button>
        )}

        {(playedMove?.classification === "mistake" ||
          playedMove?.classification === "blunder") && (
          <button
            onClick={() => {
              if (!playedMove || !playedMove.bestUci || !playedMove.bestSan) return;
              savePuzzle({
                id: `${Date.now()}-${playedMove.ply}`,
                fen: playedMove.fenBefore,
                bestMove: playedMove.bestUci,
                bestMoveSan: playedMove.bestSan,
                playerMove: playedMove.uci,
                playerMoveSan: playedMove.san,
                classification: playedMove.classification ?? "mistake",
                userColor: playedMove.fenBefore.split(" ")[1] as "w" | "b",
                whiteName,
                blackName,
                savedAt: Date.now(),
              });
              alert("Puzzle saved! Check My Puzzles page.");
            }}
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fg"
          >
            Save as Puzzle
          </button>
        )}

        {showBest && playedMove && (
          <div className="panel rounded-xl p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
                best
              </span>
              <span className="font-mono font-semibold text-accent">
                {playedMove.bestSan}
              </span>
              {playedMove.bestLineSan.length > 1 && (
                <span className="truncate font-mono text-xs text-muted">
                  {playedMove.bestLineSan.slice(1).join(" ")}
                </span>
              )}
            </div>
          </div>
        )}

        <EngineStatus
          state={engineState}
          info={engineInfo}
          depth={depthSeen}
          progress={progress}
        />

        <div className="panel rounded-2xl p-3">
          {N > 0 ? (
            <MoveList moves={moves} currentPly={ply} onSelect={go} />
          ) : (
            <p className="p-3 text-sm text-muted">This game has no moves.</p>
          )}
        </div>

        <AccuracySummary
          whiteName={whiteName}
          blackName={blackName}
          summary={summary}
        />
      </div>

      {showShareCard && (
        <ShareCard data={shareCardData} onClose={() => setShowShareCard(false)} />
      )}
    </div>
  );
}

/* ============================ sub-views =========================== */

function PlayerTag({
  name,
  color,
  accuracy,
}: {
  name: string;
  color: "white" | "black";
  accuracy: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-3 w-3 rounded-full border border-line-strong ${
            color === "white" ? "bg-[#f5f7fa]" : "bg-[#15181d]"
          }`}
        />
        <span className="truncate text-sm font-medium text-fg">{name}</span>
      </div>
      {accuracy != null && (
        <span className="rounded-md bg-panel-2 px-2 py-0.5 font-mono text-xs text-muted">
          {accuracy}% acc
        </span>
      )}
    </div>
  );
}

function Controls({
  ply,
  total,
  onGo,
  orientation,
  onFlip,
  showArrows,
  onToggleArrows,
}: {
  ply: number;
  total: number;
  onGo: (p: number) => void;
  orientation: "white" | "black";
  onFlip: () => void;
  showArrows: boolean;
  onToggleArrows: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <NavBtn label="⏮" onClick={() => onGo(0)} disabled={ply === 0} />
        <NavBtn label="◀" onClick={() => onGo(ply - 1)} disabled={ply === 0} />
        <span className="px-2 font-mono text-xs text-muted tabular-nums">
          {ply}/{total}
        </span>
        <NavBtn label="▶" onClick={() => onGo(ply + 1)} disabled={ply === total} />
        <NavBtn label="⏭" onClick={() => onGo(total)} disabled={ply === total} />
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleArrows}
          title="Toggle best-move arrow"
          className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs transition ${
            showArrows
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-line bg-panel text-muted hover:text-fg"
          }`}
        >
          ➤ best
        </button>
        <button
          onClick={onFlip}
          title="Flip board (f)"
          className="rounded-lg border border-line bg-panel px-2.5 py-1.5 font-mono text-xs text-muted transition hover:text-fg"
        >
          ⇅ {orientation === "white" ? "W" : "B"}
        </button>
      </div>
    </div>
  );
}

function NavBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-sm text-fg transition hover:border-line-strong disabled:opacity-30"
    >
      {label}
    </button>
  );
}

function EngineStatus({
  state,
  info,
  depth,
  progress,
}: {
  state: EngineState;
  info: EngineInfo | null;
  depth: number;
  progress: { done: number; total: number };
}) {
  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const threadLabel = info
    ? info.multiThreaded
      ? `${info.threads} threads`
      : "single-threaded"
    : "";
  const label =
    "Stockfish 18" +
    (threadLabel ? ` · ${threadLabel}` : "") +
    (depth ? ` · depth ${depth}` : "");
  return (
    <div className="panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              state === "unavailable"
                ? "bg-rose"
                : state === "done"
                  ? "bg-accent"
                  : "bg-amber animate-pulse-dot"
            }`}
          />
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 font-mono text-xs text-faint">
          {state === "loading" && "loading…"}
          {state === "running" && `${progress.done}/${progress.total}`}
          {state === "done" && "complete"}
          {state === "unavailable" && "unavailable"}
        </span>
      </div>
      {(state === "running" || state === "done") && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${state === "done" ? 100 : pct}%` }}
          />
        </div>
      )}
      {state === "unavailable" && (
        <p className="mt-2 text-xs leading-relaxed text-faint">
          Engine analysis couldn&apos;t run in this browser — you can still
          replay every move below.
        </p>
      )}
    </div>
  );
}

function AccuracySummary({
  whiteName,
  blackName,
  summary,
}: {
  whiteName: string;
  blackName: string;
  summary: ReturnType<typeof summarize>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SideCard name={whiteName} color="white" side={summary.white} />
      <SideCard name={blackName} color="black" side={summary.black} />
    </div>
  );
}

const SUMMARY_ROWS: { label: string; cls: Classification; optional?: boolean }[] =
  [
    { label: "Brilliant", cls: "brilliant", optional: true },
    { label: "Great", cls: "great", optional: true },
    { label: "Best", cls: "best" },
    { label: "Book", cls: "book", optional: true },
    { label: "Inaccuracies", cls: "inaccuracy" },
    { label: "Misses", cls: "miss", optional: true },
    { label: "Mistakes", cls: "mistake" },
    { label: "Blunders", cls: "blunder" },
  ];

function SideCard({
  name,
  color,
  side,
}: {
  name: string;
  color: "white" | "black";
  side: ReturnType<typeof summarize>["white"];
}) {
  return (
    <div className="panel rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full border border-line-strong ${
            color === "white" ? "bg-[#f5f7fa]" : "bg-[#15181d]"
          }`}
        />
        <span className="truncate text-sm font-medium text-fg">{name}</span>
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-fg">
        {side.accuracy != null ? `${side.accuracy}` : "—"}
        <span className="ml-1 text-sm font-normal text-faint">% acc</span>
      </div>
      <div className="mt-3 space-y-1 text-xs">
        {SUMMARY_ROWS.filter((r) => !r.optional || side.counts[r.cls] > 0).map(
          (r) => (
            <CountRow
              key={r.cls}
              label={r.label}
              n={side.counts[r.cls]}
              cls={r.cls}
            />
          ),
        )}
      </div>
    </div>
  );
}

function CountRow({
  label,
  n,
  cls,
}: {
  label: string;
  n: number;
  cls: Classification;
}) {
  const meta = CLASS_META[cls];
  return (
    <div className="flex items-center justify-between">
      <span className={`flex items-center gap-1.5 ${meta.text}`}>
        <span>{meta.symbol}</span>
        <span className="text-muted">{label}</span>
      </span>
      <span className="font-mono tabular-nums text-fg">{n}</span>
    </div>
  );
}

/* ============================ helpers ============================= */

interface ParsedPgn {
  moves: MoveReview[];
  startFen: string;
  error: boolean;
}

function parsePgn(pgn: string): ParsedPgn {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    const startFen = history.length > 0 ? history[0].before : new Chess().fen();

    const moves: MoveReview[] = history.map((h, i) => ({
      ply: i + 1,
      moveNo: Math.floor(i / 2) + 1,
      color: h.color,
      san: h.san,
      uci: `${h.from}${h.to}${h.promotion ?? ""}`,
      fenBefore: h.before,
      fenAfter: h.after,
      evalWhiteCp: null,
      bestUci: null,
      bestSan: null,
      bestLineSan: [],
      classification: null,
      winDrop: null,
      accuracy: null,
      coachTitle: null,
      coachMessage: null,
      analyzed: false,
    }));

    return { moves, startFen, error: false };
  } catch {
    return { moves: [], startFen: new Chess().fen(), error: true };
  }
}

function uciToSan(fen: string, uci: string): string | null {
  try {
    const c = new Chess(fen);
    const mv = c.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return mv ? mv.san : null;
  } catch {
    return null;
  }
}

function pvToSan(fen: string, pv: string[], max: number): string[] {
  const out: string[] = [];
  try {
    const c = new Chess(fen);
    for (let i = 0; i < Math.min(pv.length, max); i++) {
      const u = pv[i];
      const mv = c.move({
        from: u.slice(0, 2),
        to: u.slice(2, 4),
        promotion: u.length > 4 ? u[4] : undefined,
      });
      if (!mv) break;
      out.push(mv.san);
    }
  } catch {
    /* ignore */
  }
  return out;
}

function checkSquareOf(fen: string): string | null {
  try {
    const c = new Chess(fen);
    if (!c.isCheck()) return null;
    const turn = c.turn();
    for (const row of c.board()) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === turn) return sq.square;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function formatEvalShort(cpWhite: number): string {
  if (Math.abs(cpWhite) >= 90000) {
    const mate = Math.ceil((100000 - Math.abs(cpWhite)) / 100);
    return `M${mate}`;
  }
  const pawns = cpWhite / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}
