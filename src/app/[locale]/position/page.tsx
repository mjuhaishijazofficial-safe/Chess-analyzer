"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { Board } from "@/components/board";
import { Engine, type EngineEval } from "@/lib/engine";
import { classifyMove, cpStm, material, CLASS_META, type Classification } from "@/lib/chess-review";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ANALYZE_MOVETIME = 1500; // ms — full-strength single-position analysis

function formatEval(scoreCp: number | null, mate: number | null): string {
  if (mate !== null) return `M${Math.abs(mate)}`;
  if (scoreCp === null) return "—";
  const pawns = scoreCp / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

function uciToSan(fen: string, uci: string): string {
  try {
    const c = new Chess(fen);
    const move = c.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
    });
    return move?.san ?? uci;
  } catch {
    return uci;
  }
}

function pvToSan(fen: string, pv: string[], maxPlies = 6): string {
  try {
    const c = new Chess(fen);
    const sans: string[] = [];
    for (const uci of pv.slice(0, maxPlies)) {
      const move = c.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
      });
      if (!move) break;
      sans.push(move.san);
    }
    return sans.join(" ");
  } catch {
    return pv.slice(0, maxPlies).join(" ");
  }
}

function isValidFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

interface QualityResult {
  classification: Classification;
}

/**
 * Judges how good the engine's suggested best move actually is — "Best",
 * or something more (a forced "Only move", or a "Brilliant" sacrifice) —
 * by reusing the same classifyMove() logic Game Review uses. Since we're
 * grading the engine's own top choice, this can never come back as a
 * mistake/blunder — it only ever tells you how *impressive* the move is.
 * Needs one extra engine call on the resulting position.
 */
async function judgeBestMove(
  engine: Engine,
  fen: string,
  evalResult: EngineEval,
): Promise<QualityResult | null> {
  const bestUci = evalResult.bestMove;
  if (!bestUci) return null;

  const chess = new Chess(fen);
  const moverColor = chess.turn();
  const legalCount = chess.moves().length;
  const matBefore = material(fen, moverColor);

  let fenAfter: string;
  try {
    const played = chess.move({
      from: bestUci.slice(0, 2),
      to: bestUci.slice(2, 4),
      promotion: bestUci.length > 4 ? bestUci.slice(4, 5) : undefined,
    });
    if (!played) return null;
    fenAfter = chess.fen();
  } catch {
    return null;
  }

  const afterEval = await engine.analyze(fenAfter, { movetime: ANALYZE_MOVETIME });
  const moverAfterCp = -cpStm(afterEval.lines[0]);

  // Material after the opponent's best reply — needed to tell a real
  // sacrifice from a move that just wins material outright.
  let matAfter = material(fenAfter, moverColor);
  const oppReply = afterEval.bestMove;
  if (oppReply) {
    try {
      const c2 = new Chess(fenAfter);
      c2.move({
        from: oppReply.slice(0, 2),
        to: oppReply.slice(2, 4),
        promotion: oppReply.length > 4 ? oppReply.slice(4, 5) : undefined,
      });
      matAfter = material(c2.fen(), moverColor);
    } catch {
      /* keep matAfter as-is */
    }
  }
  const sacrifice = matBefore - matAfter;

  const res = classifyMove({
    ply: 999, // no game/book context for an arbitrary position
    playedUci: bestUci,
    bestUci,
    bestCpStm: cpStm(evalResult.lines[0]),
    secondCpStm: evalResult.lines[1] ? cpStm(evalResult.lines[1]) : null,
    moverAfterCp,
    legalCount,
    sacrifice,
    bookMatchPlies: 0,
  });

  return { classification: res.classification };
}

export default function PositionPage() {
  const searchParams = useSearchParams();
  const engineRef = useRef<Engine | null>(null);

  const [fenInput, setFenInput] = useState(searchParams.get("fen") ?? START_FEN);
  const [activeFen, setActiveFen] = useState(fenInput);
  const [evalResult, setEvalResult] = useState<EngineEval | null>(null);
  const [quality, setQuality] = useState<QualityResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [judgingQuality, setJudgingQuality] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    engineRef.current = new Engine();
    return () => engineRef.current?.destroy();
  }, []);

  const runAnalysis = useCallback((fen: string) => {
    if (!isValidFen(fen)) {
      setError("That doesn't look like a valid FEN.");
      setEvalResult(null);
      setQuality(null);
      return;
    }
    setError(null);
    setActiveFen(fen);
    setAnalyzing(true);
    setEvalResult(null);
    setQuality(null);

    const url = new URL(window.location.href);
    url.searchParams.set("fen", fen);
    window.history.replaceState(null, "", url.toString());

    const engine = engineRef.current;
    if (!engine) return;

    engine
      .analyze(fen, { movetime: ANALYZE_MOVETIME })
      .then(async (result) => {
        setEvalResult(result);
        setAnalyzing(false);
        setJudgingQuality(true);
        const q = await judgeBestMove(engine, fen, result);
        setQuality(q);
        setJudgingQuality(false);
      })
      .catch(() => setAnalyzing(false));
  }, []);

  useEffect(() => {
    runAnalysis(fenInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnalyzeClick() {
    runAnalysis(fenInput.trim());
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const bestMove = evalResult?.bestMove;
  const bestMoveLastMove = bestMove
    ? { from: bestMove.slice(0, 2), to: bestMove.slice(2, 4) }
    : null;

  const qualityMeta = quality ? CLASS_META[quality.classification] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-fg">Position Analyzer</h1>
      <p className="mb-6 text-sm text-muted">
        Paste any FEN, get Stockfish&apos;s strongest move for that exact position, and share
        the link — no full game required.
      </p>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
        <div>
          <Board fen={isValidFen(activeFen) ? activeFen : START_FEN} lastMove={bestMoveLastMove} />
        </div>

        <div>
          <label className="mb-2 block text-sm text-faint">FEN</label>
          <textarea
            value={fenInput}
            onChange={(e) => setFenInput(e.target.value)}
            rows={2}
            spellCheck={false}
            className="w-full resize-none rounded border border-line bg-panel p-2 font-mono text-sm text-fg"
          />
          {error && <p className="mt-1 text-sm text-rose">{error}</p>}

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAnalyzeClick}
              disabled={analyzing}
              className="rounded bg-fg px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
            >
              {analyzing ? "Analyzing…" : "Analyze"}
            </button>
            <button
              onClick={copyLink}
              className="rounded border border-faint px-4 py-2 text-sm text-faint"
            >
              {copied ? "Copied!" : "Copy shareable link"}
            </button>
          </div>

          <div className="mt-6">
            {analyzing && <p className="text-sm text-faint">Thinking…</p>}

            {!analyzing && evalResult && (
              <div className="space-y-3">
                {evalResult.bestMove && (
                  <div className="rounded border border-accent/40 bg-accent/10 p-3">
                    <p className="text-xs uppercase tracking-wide text-faint">Best move</p>
                    <p className="text-lg font-semibold text-fg">
                      {uciToSan(activeFen, evalResult.bestMove)}{" "}
                      <span className="text-sm font-normal text-faint">
                        ({formatEval(evalResult.lines[0]?.scoreCp ?? null, evalResult.lines[0]?.mate ?? null)})
                      </span>
                      {judgingQuality && (
                        <span className="ml-2 text-xs font-normal text-faint">judging…</span>
                      )}
                      {qualityMeta && (
                        <span className={`ml-2 text-sm font-semibold ${qualityMeta.text}`}>
                          {qualityMeta.symbol} {qualityMeta.label}
                        </span>
                      )}
                    </p>
                    {qualityMeta && (
                      <p className="mt-1 text-sm text-muted">{qualityMeta.blurb}</p>
                    )}
                  </div>
                )}

                {evalResult.lines.map((line, i) => (
                  <div key={i} className="rounded border border-line bg-panel p-3">
                    <p className="text-xs uppercase tracking-wide text-faint">
                      Line {i + 1} · {formatEval(line.scoreCp, line.mate)}
                    </p>
                    <p className="mt-1 font-mono text-sm text-fg">
                      {pvToSan(activeFen, line.pv)}
                    </p>
                  </div>
                ))}

                <p className="text-xs text-faint">Depth {evalResult.depth}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
