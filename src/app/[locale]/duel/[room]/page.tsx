"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Board } from "@/components/board";
import { DuelGame, type DuelSnapshot } from "@/lib/duel";
import { CLASS_META } from "@/lib/chess-review";
import { checkSquareOf } from "@/lib/bot";
import { isSoundEnabled, playMoveSound, playCaptureSound, playCheckSound } from "@/lib/sound";

export default function DuelRoomPage() {
  const params = useParams<{ room: string }>();
  const gameRef = useRef<DuelGame | null>(null);
  const [snapshot, setSnapshot] = useState<DuelSnapshot | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(
    null,
  );

  useEffect(() => {
    const game = new DuelGame(params.room);
    game.onChange = (snap) => setSnapshot(snap);
    gameRef.current = game;
    return () => game.destroy();
  }, [params.room]);

  const prevHistoryLen = useRef(0);
  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.history.length > prevHistoryLen.current && isSoundEnabled()) {
      const lastMove = snapshot.history[snapshot.history.length - 1];
      if (snapshot.inCheck) playCheckSound();
      else if (lastMove?.captured) playCaptureSound();
      else playMoveSound();
    }
    prevHistoryLen.current = snapshot.history.length;
  }, [snapshot]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSquareClick(square: string) {
    const game = gameRef.current;
    if (!game || !snapshot || pendingPromotion) return;
    if (snapshot.seat === null || snapshot.turn !== snapshot.seat) return;

    if (selected) {
      const legal = game.legalMovesFrom(selected);
      if (legal.includes(square)) {
        if (game.isPromotionMove(selected, square)) {
          setPendingPromotion({ from: selected, to: square });
          setSelected(null);
          return;
        }
        void game.playMove(selected, square);
        setSelected(null);
        return;
      }
    }
    const legalFromClicked = game.legalMovesFrom(square);
    setSelected(legalFromClicked.length > 0 ? square : null);
  }

  function choosePromotion(piece: string) {
    const game = gameRef.current;
    if (!game || !pendingPromotion) return;
    void game.playMove(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
  }

  if (!snapshot) return null;

  const lastMoveEntry = snapshot.history[snapshot.history.length - 1];
  const lastMove = lastMoveEntry ? { from: lastMoveEntry.from, to: lastMoveEntry.to } : null;
  const checkSquare = checkSquareOf(snapshot.fen);
  const isMyTurn = snapshot.seat !== null && snapshot.turn === snapshot.seat;
  const meta = snapshot.lastAnalysis ? CLASS_META[snapshot.lastAnalysis.classification] : null;

  let gameOverText: string | null = null;
  if (snapshot.gameOverReason === "checkmate") {
    gameOverText =
      snapshot.winner === snapshot.seat ? "Checkmate — you win! 🎉" : "Checkmate — you lost";
  } else if (snapshot.gameOverReason === "stalemate") {
    gameOverText = "Draw by stalemate";
  } else if (snapshot.gameOverReason === "draw") {
    gameOverText = "Draw";
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-faint">
          {snapshot.status === "waiting" && "Waiting for your friend to join…"}
          {snapshot.status === "connected" &&
            (gameOverText ??
              (isMyTurn ? "Your move" : snapshot.inCheck ? "Check! Waiting on opponent…" : "Waiting on opponent…"))}
          {snapshot.status === "connecting" && "Connecting…"}
        </span>
        <button onClick={copyLink} className="text-sm underline text-faint">
          {copied ? "Copied!" : "Copy invite link"}
        </button>
      </div>

      <div className="relative">
        <Board
          fen={snapshot.fen}
          orientation={snapshot.seat === "b" ? "black" : "white"}
          lastMove={lastMove}
          checkSquare={checkSquare}
          onSquareClick={snapshot.gameOver ? undefined : handleSquareClick}
          selectedSquare={selected}
          legalMoves={selected ? gameRef.current?.legalMovesFrom(selected) : undefined}
        />

        {pendingPromotion && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
            <div className="rounded-lg border border-faint/40 bg-panel p-4 text-center">
              <p className="mb-3 text-sm text-faint">Promote to</p>
              <div className="flex gap-2">
                {["q", "r", "b", "n"].map((p) => (
                  <button
                    key={p}
                    onClick={() => choosePromotion(p)}
                    className="grid h-12 w-12 place-items-center rounded border border-faint/40 text-lg font-semibold uppercase hover:bg-panel-2"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Your own instant move analysis — never visible to your opponent */}
      <div className="mt-4 min-h-[3.5rem] rounded border border-line bg-panel p-3">
        {snapshot.lastAnalysis && meta ? (
          <p className="text-sm">
            <span className="font-semibold text-fg">{snapshot.lastAnalysis.san}</span>{" "}
            <span className={`font-semibold ${meta.text}`}>
              {meta.symbol} {meta.label}
            </span>
          </p>
        ) : (
          <p className="text-sm text-faint">Your move analysis appears here after you play.</p>
        )}
      </div>

      {snapshot.status === "waiting" && (
        <p className="mt-3 text-center text-xs text-faint">
          Share the invite link above — the game starts as soon as your friend opens it.
        </p>
      )}
    </div>
  );
}
