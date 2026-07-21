/**
 * Bot Feature — single adjustable-Elo Stockfish opponent.
 *
 * Wraps chess.js (game rules/legal moves) + Engine (Stockfish worker) into
 * one small API the /play page can drive: pick an Elo, pick how many free
 * opening moves the human gets, then alternate moves until game over.
 *
 * See "Bot Feature Specification": adjustable Elo 100-3200+, free opening
 * moves (0/1/2/3/5/10/custom), Stockfish UCI_Elo/UCI_LimitStrength/Skill
 * Level, and named strength profiles for display.
 */

import { Chess, type Move } from "chess.js";
import { Engine, BOT_MIN_ELO, BOT_MAX_ELO } from "./engine";

export { BOT_MIN_ELO, BOT_MAX_ELO };

/** Preset Elo choices shown as quick-pick chips in the UI. */
export const ELO_PRESETS = [100, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200] as const;

/** Preset free-opening-move counts, per the spec ("0,1,2,3,5,10 or any number"). */
export const FREE_MOVE_PRESETS = [0, 1, 2, 3, 5, 10] as const;

export interface StrengthProfile {
  name: string;
  min: number;
  max: number;
}

/** Named bands purely for display (e.g. "Elo 1450 — Intermediate"). */
export const STRENGTH_PROFILES: StrengthProfile[] = [
  { name: "Beginner", min: 100, max: 799 },
  { name: "Intermediate", min: 800, max: 1799 },
  { name: "Advanced", min: 1800, max: 2499 },
  { name: "Master", min: 2500, max: BOT_MAX_ELO },
];

export function strengthProfileFor(elo: number): StrengthProfile {
  return (
    STRENGTH_PROFILES.find((p) => elo >= p.min && elo <= p.max) ??
    STRENGTH_PROFILES[STRENGTH_PROFILES.length - 1]
  );
}

export function clampElo(elo: number): number {
  return Math.max(BOT_MIN_ELO, Math.min(BOT_MAX_ELO, Math.round(elo)));
}

/** How long the bot "thinks" per move — scales with Elo so weak bots move fast and strong ones use more time. */
function movetimeForElo(elo: number): number {
  const t = (clampElo(elo) - BOT_MIN_ELO) / (BOT_MAX_ELO - BOT_MIN_ELO); // 0..1
  return Math.round(300 + t * 2200); // 300ms (Elo 100) .. 2500ms (Elo 3200)
}

export type GameStatus =
  | "free-moves" // human is still playing out their free opening moves
  | "playing"
  | "bot-thinking"
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resigned";

export interface BotGameOpts {
  elo: number;
  freeMoves: number;
  /** Which side the human plays. */
  humanColor?: "w" | "b";
}

export interface BotGameSnapshot {
  fen: string;
  status: GameStatus;
  history: Move[];
  freeMovesRemaining: number;
  turn: "w" | "b";
  humanColor: "w" | "b";
  winner: "w" | "b" | null;
}

/**
 * Drives one game against the bot. Create it, call `humanMove()` for the
 * player's turns (including free-opening ones), and it fires `onChange`
 * whenever the board updates — including after the bot replies on its own.
 */
export class BotGame {
  private chess = new Chess();
  private engine: Engine;
  private opts: Required<BotGameOpts>;
  private freeMovesRemaining: number;
  private status: GameStatus = "playing";
  private destroyed = false;

  onChange: ((snapshot: BotGameSnapshot) => void) | null = null;

  constructor(engine: Engine, opts: BotGameOpts) {
    this.engine = engine;
    this.opts = { humanColor: "w", ...opts, elo: clampElo(opts.elo) };
    this.freeMovesRemaining = Math.max(0, Math.floor(opts.freeMoves));
    this.status = this.freeMovesRemaining > 0 ? "free-moves" : "playing";
    void this.engine.setStrength(this.opts.elo);
  }

  snapshot(): BotGameSnapshot {
    return {
      fen: this.chess.fen(),
      status: this.status,
      history: this.chess.history({ verbose: true }),
      freeMovesRemaining: this.freeMovesRemaining,
      turn: this.chess.turn(),
      humanColor: this.opts.humanColor,
      winner: this.winner(),
    };
  }

  private winner(): "w" | "b" | null {
    if (!this.chess.isCheckmate()) return null;
    return this.chess.turn() === "w" ? "b" : "w";
  }

  legalMovesFrom(square: string): string[] {
    return this.chess.moves({ square: square as never, verbose: true }).map((m) => m.to);
  }

  private emit() {
    this.onChange?.(this.snapshot());
  }

  private isGameOverNow(): boolean {
    if (this.chess.isCheckmate()) {
      this.status = "checkmate";
      return true;
    }
    if (this.chess.isStalemate()) {
      this.status = "stalemate";
      return true;
    }
    if (this.chess.isDraw()) {
      this.status = "draw";
      return true;
    }
    return false;
  }

  /** Human plays a move (`from`/`to` squares, e.g. "e2"/"e4"). Promotion defaults to queen. */
  async humanMove(from: string, to: string, promotion = "q"): Promise<boolean> {
    if (this.destroyed) return false;
    if (this.status !== "playing" && this.status !== "free-moves") return false;
    if (this.chess.turn() !== this.opts.humanColor && this.status !== "free-moves") {
      return false; // not the human's turn
    }

    let move: Move | null = null;
    try {
      move = this.chess.move({ from, to, promotion });
    } catch {
      return false; // illegal move
    }
    if (!move) return false;

    if (this.status === "free-moves") {
      this.freeMovesRemaining = Math.max(0, this.freeMovesRemaining - 1);
      if (this.freeMovesRemaining === 0) this.status = "playing";
      this.emit();
      // During free moves the bot doesn't reply — the human keeps setting
      // up the position until they've used all their free moves.
      return true;
    }

    this.emit();
    if (this.isGameOverNow()) {
      this.emit();
      return true;
    }
    await this.maybeBotMove();
    return true;
  }

  /** Called if the human wants to stop taking free moves early. */
  async finishFreeMoves(): Promise<void> {
    if (this.destroyed) return;
    this.freeMovesRemaining = 0;
    this.status = "playing";
    this.emit();
    await this.maybeBotMove();
  }

  private async maybeBotMove(): Promise<void> {
    if (this.destroyed) return;
    if (this.status !== "playing") return;
    if (this.chess.turn() === this.opts.humanColor) return; // waiting on human

    this.status = "bot-thinking";
    this.emit();

    const fen = this.chess.fen();
    const evalResult = await this.engine.analyze(fen, {
      movetime: movetimeForElo(this.opts.elo),
    });
    if (this.destroyed) return;

    const uci = evalResult.bestMove;
    if (!uci) {
      this.isGameOverNow();
      this.status = this.status === "bot-thinking" ? "playing" : this.status;
      this.emit();
      return;
    }

    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci.slice(4, 5) : undefined;
    try {
      this.chess.move({ from, to, promotion });
    } catch {
      this.status = "playing";
      this.emit();
      return;
    }

    this.status = "playing";
    if (!this.isGameOverNow()) this.status = "playing";
    this.emit();
  }

  resign(): void {
    this.status = "resigned";
    this.emit();
  }

  /** Change the bot's Elo mid-game. */
  async setElo(elo: number): Promise<void> {
    this.opts.elo = clampElo(elo);
    await this.engine.setStrength(this.opts.elo);
  }

  destroy(): void {
    this.destroyed = true;
    this.onChange = null;
  }
}