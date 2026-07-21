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

export default function PlayPage() {
  const [started, setStarted] = useState(false);
  const [elo, setElo] = useState(1200);
  const [freeMoves, setFreeMoves] = useState(0);

  const engineRef = useRef<Engine | null>(null);
  const gameRef = useRef<BotGame | null>(null);
  const [snapshot, setSnapshot] = useState<BotGameSnapshot | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Tear down the engine + game when leaving the page.
  useEffect(() => {
    return () => {
      gameRef.current?.destroy();
      engineRef.current?.destroy();
    };
  }, []);

  function startGame() {
    const engine = new Engine();
    const game = new BotGame(engine, { elo, freeMoves });
    game.onChange = (snap) => setSnapshot(snap);
    engineRef.current = engine;
    gameRef.current = game;
    setSnapshot(game.snapshot());
    setStarted(true);
  }

  function newGame() {
    gameRef.current?.destroy();
    engineRef.current?.destroy();
    gameRef.current = null;
    engineRef.current = null;
    setSnapshot(null);
    setSelected(null);
    setStarted(false);
  }

  function handleSquareClick(square: string) {
    const game = gameRef.current;
    if (!game) return;

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
        fen={snapshot.fen}
        orientation={snapshot.humanColor === "b" ? "black" : "white"}
        onSquareClick={gameOver ? undefined : handleSquareClick}
        selectedSquare={selected}
        legalMoves={selected ? gameRef.current?.legalMovesFrom(selected) : undefined}
      />

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
