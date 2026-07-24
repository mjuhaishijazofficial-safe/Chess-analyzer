/**
 * Duel — realtime friend-link human-vs-human play.
 *
 * Uses a Supabase Realtime *broadcast* channel keyed by the room id from
 * the URL — nothing is written to the database, no accounts needed. Two
 * browsers open the same link, both join the same channel, and moves are
 * relayed between them.
 *
 * Move-quality analysis (book check / Stockfish eval) runs entirely on
 * each player's own machine after *their own* move and is never sent over
 * the channel — your opponent never sees your analysis, only the move.
 */

import { Chess, type Move } from "chess.js";
import { supabase } from "./supabase";
import { Engine } from "./engine";
import { bookPlies } from "./opening-book";
import { classifyMove, cpStm, type Classification } from "./chess-review";

const ANALYZE_MOVETIME = 500; // ms — fast enough to feel instant

export type Seat = "w" | "b";
export type ConnectionStatus = "connecting" | "waiting" | "connected" | "disconnected";

export interface OwnMoveAnalysis {
  san: string;
  classification: Classification;
}

export type GameOverReason = "checkmate" | "stalemate" | "draw" | null;

export interface DuelSnapshot {
  fen: string;
  history: Move[];
  turn: Seat;
  seat: Seat | null; // your color — null until assigned
  status: ConnectionStatus;
  gameOver: boolean;
  gameOverReason: GameOverReason;
  winner: Seat | null;
  inCheck: boolean;
  lastAnalysis: OwnMoveAnalysis | null; // only ever set from YOUR OWN moves
}

interface MovePayload {
  from: string;
  to: string;
  promotion?: string;
  clientId: string;
}

export class DuelGame {
  private chess = new Chess();
  private channel: ReturnType<typeof supabase.channel>;
  private clientId = crypto.randomUUID();
  private engine = new Engine();
  private seat: Seat | null = null;
  private status: ConnectionStatus = "connecting";
  private lastAnalysis: OwnMoveAnalysis | null = null;
  private destroyed = false;

  // Background eval of the *current* position (before whoever's next move),
  // kicked off as soon as it's relevant, so it's usually ready by the time
  // a move is actually played.
  private pendingBeforeEval: ReturnType<Engine["analyze"]> | null = null;
  private pendingBeforeFen: string | null = null;

  onChange: ((snapshot: DuelSnapshot) => void) | null = null;

  constructor(roomId: string) {
    this.channel = supabase.channel(`duel:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: this.clientId } },
    });

    this.channel
      .on("broadcast", { event: "move" }, ({ payload }) => {
        this.applyRemoteMove(payload as MovePayload);
      })
      .on("presence", { event: "sync" }, () => this.assignSeatFromPresence())
      .subscribe(async (subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          await this.channel.track({ joinedAt: Date.now() });
        }
      });

    this.primeBackgroundEval();
  }

  private assignSeatFromPresence() {
    const state = this.channel.presenceState<{ joinedAt: number }>();
    const entries = Object.entries(state)
      .map(([id, metas]) => ({ id, joinedAt: metas[0]?.joinedAt ?? 0 }))
      .sort((a, b) => a.joinedAt - b.joinedAt);

    if (entries.length === 0) return;

    // Earliest joiner is white, next is black. Anyone beyond that is a
    // spectator for now (no UI for it yet — out of scope for v1). Only
    // claim a seat once — but keep recomputing `status` below on every
    // sync, even after the seat is set, or a late-joining opponent would
    // never flip us from "waiting" to "connected".
    if (!this.seat) {
      this.seat =
        entries[0]?.id === this.clientId ? "w" : entries[1]?.id === this.clientId ? "b" : null;
    }

    this.status = entries.length >= 2 ? "connected" : "waiting";
    this.primeBackgroundEval();
    this.emit();
  }

  private emit() {
    let gameOverReason: GameOverReason = null;
    if (this.chess.isCheckmate()) gameOverReason = "checkmate";
    else if (this.chess.isStalemate()) gameOverReason = "stalemate";
    else if (this.chess.isDraw()) gameOverReason = "draw";

    // On checkmate, the side to move is the one who got mated — the winner is the other side.
    const winner: Seat | null =
      gameOverReason === "checkmate" ? (this.chess.turn() === "w" ? "b" : "w") : null;

    this.onChange?.({
      fen: this.chess.fen(),
      history: this.chess.history({ verbose: true }),
      turn: this.chess.turn(),
      seat: this.seat,
      status: this.status,
      gameOver: this.chess.isGameOver(),
      gameOverReason,
      winner,
      inCheck: this.chess.isCheck(),
      lastAnalysis: this.lastAnalysis,
    });
  }

  /** Starts analyzing the current position in the background so it's ready the instant a move needs judging. */
  private primeBackgroundEval() {
    const fen = this.chess.fen();
    if (this.pendingBeforeFen === fen) return; // already priming this position
    this.pendingBeforeFen = fen;
    this.pendingBeforeEval = this.engine.analyze(fen, { movetime: ANALYZE_MOVETIME });
  }

  private applyRemoteMove(payload: MovePayload) {
    if (this.destroyed || payload.clientId === this.clientId) return;
    try {
      this.chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion });
    } catch {
      return; // out-of-sync / illegal — ignore rather than crash the game
    }
    this.primeBackgroundEval();
    this.emit();
  }

  legalMovesFrom(square: string): string[] {
    return this.chess.moves({ square: square as never, verbose: true }).map((m) => m.to);
  }

  isPromotionMove(from: string, to: string): boolean {
    return this.chess
      .moves({ square: from as never, verbose: true })
      .some((m) => m.to === to && !!m.promotion);
  }

  /** Play your own move — syncs to your opponent, then judges your move locally (never shared). */
  async playMove(from: string, to: string, promotion = "q"): Promise<boolean> {
    if (this.destroyed || !this.seat || this.chess.turn() !== this.seat) return false;

    const fenBefore = this.chess.fen();
    const beforeEvalPromise =
      this.pendingBeforeFen === fenBefore && this.pendingBeforeEval
        ? this.pendingBeforeEval
        : this.engine.analyze(fenBefore, { movetime: ANALYZE_MOVETIME });

    let move: Move | null;
    try {
      move = this.chess.move({ from, to, promotion });
    } catch {
      return false;
    }
    if (!move) return false;

    this.channel.send({
      type: "broadcast",
      event: "move",
      payload: { from, to, promotion, clientId: this.clientId } satisfies MovePayload,
    });

    this.lastAnalysis = null;
    this.primeBackgroundEval();
    this.emit();

    void this.judgeOwnMove(fenBefore, move, beforeEvalPromise);
    return true;
  }

  private async judgeOwnMove(
    fenBefore: string,
    move: Move,
    beforeEvalPromise: ReturnType<Engine["analyze"]>,
  ) {
    const sanHistory = this.chess.history();
    const ply = sanHistory.length;
    const matchedBookPlies = bookPlies(sanHistory);

    if (ply <= matchedBookPlies) {
      this.lastAnalysis = { san: move.san, classification: "book" };
      this.emit();
      return;
    }

    const beforeEval = await beforeEvalPromise;
    const afterEval = await this.engine.analyze(this.chess.fen(), { movetime: ANALYZE_MOVETIME });
    if (this.destroyed) return;

    const chessBefore = new Chess(fenBefore);
    const legalCount = chessBefore.moves().length;
    const playedUci = `${move.from}${move.to}${move.promotion ?? ""}`;

    const result = classifyMove({
      ply,
      playedUci,
      bestUci: beforeEval.bestMove,
      bestCpStm: cpStm(beforeEval.lines[0]),
      secondCpStm: beforeEval.lines[1] ? cpStm(beforeEval.lines[1]) : null,
      moverAfterCp: -cpStm(afterEval.lines[0]),
      legalCount,
      sacrifice: 0, // skipped for speed — real-time play favors a fast label over sacrifice/brilliancy detection
      bookMatchPlies: matchedBookPlies,
    });

    this.lastAnalysis = { san: move.san, classification: result.classification };
    this.emit();
  }

  destroy() {
    this.destroyed = true;
    this.onChange = null;
    this.engine.destroy();
    supabase.removeChannel(this.channel);
  }
}