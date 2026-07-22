"use client";

import { useEffect, useRef, useState } from "react";
import { Board } from "@/components/board";
import { Engine } from "@/lib/engine";
import {
  BotGame,
  ELO_PRESETS,
  FREE_MOVE_PRESETS,
  BOT_MIN_ELO,
  BOT_MAX_ELO,
  clampElo,
  strengthProfileFor,
  type BotGameSnapshot,
} from "@/lib/bot";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function PlayPage() {
  const [started, setStarted] = useState(false);
  const [elo, setElo] = useState(1200);
  const [freeMoves, setFreeMoves] = useState(0);

  const engineRef = useRef<Engine | null>(null);
  const gameRef = useRef<BotGame | null>(null);
  const [snapshot, setSnapshot] = useState<BotGameSnapshot | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // NEW: which ply we're looking at. null = "live" (always tracks the
  // current position, including moves as they land). A number = the user
  // stepped back to review an earlier position.
  const [viewPly, setViewPly] = useState<number | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);

  // Tear down the engine + game when leaving the page.
  useEffect(() => {
    return () => {
      gameRef.current?.destroy();
      engineRef.current?.destroy();
    };
  }, []);

  // Auto-play: step forward every 700ms while playing, stop at the end.
  useEffect(() => {
    if (!autoPlaying || !snapshot) return;
    const total = snapshot.history.length;
    const current = viewPly ?? total;
    if (current >= total) {
      setAutoPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setViewPly((p) => {
        const next = (p ?? total) + 1;
        return next >= total ? null : next; // land on "live" once caught up
      });
    }, 700);
    return () => clearTimeout(t);
  }, [autoPlaying, viewPly, snapshot]);

  function startGame() {
    const engine = new Engine();
    const game = new BotGame(engine, { elo, freeMoves });
    game.onChange = (snap) => setSnapshot(snap);
    engineRef.current = engine;
    gameRef.current = game;
    setSnapshot(game.snapshot());
    setStarted(true);
    setViewPly(null);
  }

  function newGame() {
    gameRef.current?.destroy();
    engineRef.current?.destroy();
    gameRef.current = null;
    engineRef.current = null;
    setSnapshot(null);
    setSelected(null);
    setStarted(false);
    setViewPly(null);
    setAutoPlaying(false);
  }

  function handleSquareClick(square: string) {
    const game = gameRef.current;
    if (!game) return;
    if (viewPly !== null) return; // reviewing history — moves disabled

    if (selected) {
      const legal = game.legalMovesFrom(selected);
      if (legal.includes(square)) {
        void game.humanMove(selected, square);
        setSelected(null);
        return;
      }
    }

    const legalFromClicked = game.legalMovesFrom(square);
    setSelected(legalFromClicked.length > 0 ? square : null);
  }

  // ---------- Setup screen ----------
  if (!started) {
    const profile = strengthProfileFor(elo);
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold text-fg mb-6">Play vs Bot</h1>

        <label className="block mb-2 text-sm text-faint">
          Bot strength — Elo {elo} ({profile.name})
        </label>
        <input
          type="range"
          min={BOT_MIN_ELO}
          max={BOT_MAX_ELO}
          step={10}
          value={elo}
          onChange={(e) => setElo(clampElo(Number(e.target.value)))}
          className="w-full mb-3"
        />
        <div className="flex flex-wrap gap-2 mb-8">
          {ELO_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setElo(p)}
              className={`px-3 py-1 rounded text-sm border ${
                elo === p ? "bg-fg text-bg" : "border-faint text-faint"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <label className="block mb-2 text-sm text-faint">
          Free opening moves (before the bot starts)
        </label>
        <div className="flex flex-wrap gap-2 mb-8">
          {FREE_MOVE_PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => setFreeMoves(n)}
              className={`px-3 py-1 rounded text-sm border ${
                freeMoves === n ? "bg-fg text-bg" : "border-faint text-faint"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={startGame}
          className="w-full py-3 rounded bg-fg text-bg font-medium"
        >
          Start Game
        </button>
      </div>
    );
  }

  // ---------- Game screen ----------
  if (!snapshot) return null; // brief flash while engine boots

  const statusText: Record<BotGameSnapshot["status"], string> = {
    "free-moves": `Free moves: ${snapshot.freeMovesRemaining} left`,
    playing: snapshot.turn === snapshot.humanColor ? "Your move" : "Waiting…",
    "bot-thinking": "Bot is thinking…",
    checkmate:
      snapshot.winner === snapshot.humanColor
        ? "Checkmate — you win! 🎉"
        : "Checkmate — bot wins",
    stalemate: "Draw by stalemate",
    draw: "Draw",
    resigned: "You resigned",
  };

  const gameOver = ["checkmate", "stalemate", "draw", "resigned"].includes(
    snapshot.status,
  );

  const total = snapshot.history.length;
  const ply = viewPly ?? total; // 0..total, "total" = live position
  const isLive = viewPly === null;

  // Position + last-move highlight for whichever ply we're viewing.
  // chess.js verbose moves carry `before`/`after` FEN, so no replay needed.
  const displayFen =
    ply === 0
      ? (snapshot.history[0]?.before ?? START_FEN)
      : (snapshot.history[ply - 1]?.after ?? snapshot.fen);
  const displayLastMove =
    ply === 0
      ? null
      : { from: snapshot.history[ply - 1].from, to: snapshot.history[ply - 1].to };

  function goTo(p: number) {
    const clamped = Math.max(0, Math.min(total, p));
    setAutoPlaying(false);
    setSelected(null);
    setViewPly(clamped >= total ? null : clamped);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-faint">{statusText[snapshot.status]}</span>
        {snapshot.status === "free-moves" && (
          <button
            onClick={() => void gameRef.current?.finishFreeMoves()}
            className="text-sm underline text-faint"
          >
            Start now
          </button>
        )}
      </div>

      <Board
        fen={displayFen}
        orientation={snapshot.humanColor === "b" ? "black" : "white"}
        lastMove={displayLastMove}
        onSquareClick={gameOver || !isLive ? undefined : handleSquareClick}
        selectedSquare={isLive ? selected : null}
        legalMoves={isLive && selected ? gameRef.current?.legalMovesFrom(selected) : undefined}
      />

      {/* NEW: playback controls — first / prev / play-pause / next / last + "p/total" counter */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => goTo(0)}
          disabled={ply === 0}
          className="px-2 py-1 rounded border border-faint text-faint text-sm disabled:opacity-30"
          aria-label="First move"
        >
          ⏮
        </button>
        <button
          onClick={() => goTo(ply - 1)}
          disabled={ply === 0}
          className="px-2 py-1 rounded border border-faint text-faint text-sm disabled:opacity-30"
          aria-label="Previous move"
        >
          ◀
        </button>
        <span className="w-16 text-center text-sm text-faint tabular-nums">
          {ply}/{total}
        </span>
        <button
          onClick={() => setAutoPlaying((a) => !a)}
          disabled={ply >= total}
          className="px-3 py-1 rounded border border-faint text-faint text-sm disabled:opacity-30"
          aria-label={autoPlaying ? "Pause" : "Play"}
        >
          {autoPlaying ? "⏸" : "▶"}
        </button>
        <button
          onClick={() => goTo(ply + 1)}
          disabled={ply === total}
          className="px-2 py-1 rounded border border-faint text-faint text-sm disabled:opacity-30"
          aria-label="Next move"
        >
          ▶
        </button>
        <button
          onClick={() => goTo(total)}
          disabled={ply === total}
          className="px-2 py-1 rounded border border-faint text-faint text-sm disabled:opacity-30"
          aria-label="Last move (live)"
        >
          ⏭
        </button>
      </div>

      {/* Move history — current ply highlighted, click any move to jump there */}
      {total > 0 && (
        <div className="mt-4 max-h-40 overflow-y-auto rounded border border-faint/30 p-2 text-sm leading-6 text-faint">
          {Array.from({ length: Math.ceil(total / 2) }).map((_, i) => {
            const whiteIdx = i * 2;
            const blackIdx = i * 2 + 1;
            const white = snapshot.history[whiteIdx];
            const black = snapshot.history[blackIdx];
            return (
              <span key={i} className="mr-3 inline-block">
                <span className="mr-1 text-faint/60">{i + 1}.</span>
                {white && (
                  <button
                    onClick={() => goTo(whiteIdx + 1)}
                    className={`mr-2 ${ply === whiteIdx + 1 ? "text-bg bg-fg px-1 rounded" : "text-fg"}`}
                  >
                    {white.san}
                  </button>
                )}
                {black && (
                  <button
                    onClick={() => goTo(blackIdx + 1)}
                    className={ply === blackIdx + 1 ? "text-bg bg-fg px-1 rounded" : "text-fg"}
                  >
                    {black.san}
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {!isLive && (
        <p className="mt-2 text-center text-xs text-faint">
          Reviewing move {ply} of {total} —{" "}
          <button onClick={() => goTo(total)} className="underline">
            jump to live position
          </button>
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {!gameOver && (
          <button
            onClick={() => gameRef.current?.resign()}
            className="px-4 py-2 rounded border border-faint text-faint text-sm"
          >
            Resign
          </button>
        )}
        {gameOver && (
          <button
            onClick={newGame}
            className="px-4 py-2 rounded bg-fg text-bg text-sm font-medium"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
}
