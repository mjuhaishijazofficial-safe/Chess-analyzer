import { Chess } from "chess.js";
import type { Classification } from "./chess-review";

/**
 * Lightweight, chess-aware "coach" that turns an engine verdict into a friendly,
 * contextual sentence — the kind of commentary you see in chess.com Game Review.
 * It detects common motifs (captures, checks, castling, central control, piece
 * development, threats, forks, sacrifices) using chess.js and templates a message.
 */

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const NAME: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

export interface Motifs {
  san: string;
  piece: string;
  capture: boolean;
  capturedValue: number;
  check: boolean;
  mate: boolean;
  castle: "kingside" | "queenside" | null;
  centerPawn: boolean;
  develops: boolean;
  developsKingside: boolean;
  promotion: boolean;
  threatPiece: string | null; // most valuable enemy piece newly attacked
  fork: boolean;
  sacrifice: boolean; // the moved piece is left en prise (likely a sac)
}

export function detectMotifs(fen: string, uci: string): Motifs | null {
  try {
    const c = new Chess(fen);
    const mv = c.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    if (!mv) return null;
    const after = c.fen();
    const mover = mv.color;
    const opp = mover === "w" ? "b" : "w";
    const backRank = mover === "w" ? "1" : "8";

    const m: Motifs = {
      san: mv.san,
      piece: mv.piece,
      capture: !!mv.captured,
      capturedValue: mv.captured ? VALUE[mv.captured] ?? 0 : 0,
      check: mv.san.includes("+"),
      mate: mv.san.includes("#"),
      castle: mv.flags.includes("k")
        ? "kingside"
        : mv.flags.includes("q")
          ? "queenside"
          : null,
      centerPawn:
        mv.piece === "p" && ["e4", "d4", "e5", "d5"].includes(mv.to),
      develops: false,
      developsKingside: false,
      promotion: !!mv.promotion,
      threatPiece: null,
      fork: false,
      sacrifice: false,
    };

    if ((mv.piece === "n" || mv.piece === "b") && mv.from[1] === backRank) {
      m.develops = true;
      if (["f1", "g1", "f8", "g8"].includes(mv.from)) m.developsKingside = true;
    }

    // what does the piece now attack? (null-move trick)
    const targets = capturesFrom(after, mv.to, mover);
    if (targets.length) {
      targets.sort((a, b) => b - a);
      const topType = topTypeFrom(after, mv.to, mover);
      if (topType) m.threatPiece = NAME[topType];
      if (targets.length >= 2 && targets[1] >= 3) m.fork = true;
    }

    // sacrifice: the piece sits on a square the opponent can capture
    if (VALUE[mv.piece] >= 3 && squareAttackedBy(after, mv.to, opp)) {
      m.sacrifice = true;
    }

    return m;
  } catch {
    return null;
  }
}

/** Values of enemy pieces capturable from `square` by `color` (null-move). */
function capturesFrom(fen: string, square: string, color: "w" | "b"): number[] {
  try {
    const c = swappedTurn(fen, color);
    if (!c) return [];
    return c
      .moves({ square: square as never, verbose: true })
      .filter((m) => m.captured)
      .map((m) => VALUE[m.captured as string] ?? 0);
  } catch {
    return [];
  }
}

function topTypeFrom(
  fen: string,
  square: string,
  color: "w" | "b",
): string | null {
  try {
    const c = swappedTurn(fen, color);
    if (!c) return null;
    let best: { t: string; v: number } | null = null;
    for (const m of c.moves({ square: square as never, verbose: true })) {
      if (m.captured) {
        const v = VALUE[m.captured] ?? 0;
        if (!best || v > best.v) best = { t: m.captured, v };
      }
    }
    return best?.t ?? null;
  } catch {
    return null;
  }
}

function squareAttackedBy(
  fen: string,
  square: string,
  byColor: "w" | "b",
): boolean {
  try {
    const c = swappedTurn(fen, byColor);
    if (!c) return false;
    return c.moves({ verbose: true }).some((m) => m.to === square && m.captured);
  } catch {
    return false;
  }
}

function swappedTurn(fen: string, color: "w" | "b"): Chess | null {
  const parts = fen.split(" ");
  if (parts[1] === color) {
    try {
      return new Chess(fen);
    } catch {
      return null;
    }
  }
  parts[1] = color;
  parts[3] = "-"; // clear en-passant to keep the position legal
  try {
    return new Chess(parts.join(" "));
  } catch {
    return null;
  }
}

/* --------------------------- Messaging ---------------------------- */

const POSITIVE: Classification[] = [
  "brilliant",
  "great",
  "best",
  "excellent",
  "good",
];

export interface CoachInput {
  ply: number;
  san: string;
  classification: Classification;
  isPlayer: boolean;
  bestSan: string | null;
  played: Motifs | null;
  best: Motifs | null; // best move at the position before this move
  reply: Motifs | null; // best reply available after this move (the punish)
}

export interface CoachOutput {
  title: string;
  message: string;
}

export function coachReview(i: CoachInput): CoachOutput {
  const subj = i.isPlayer ? "you" : "your opponent";
  const subjCap = i.isPlayer ? "You" : "Your opponent";
  const poss = i.isPlayer ? "your" : "their";
  const possCap = i.isPlayer ? "Your" : "Their";
  const title = `${i.san} is ${article(i.classification)} ${label(i.classification)}`;

  const pick = (arr: string[]) => arr[i.ply % arr.length];

  // checkmate flourish
  if (i.played?.mate) {
    return {
      title,
      message: i.isPlayer
        ? pick([
            "Checkmate! Beautifully finished — game over.",
            "Yes! Checkmate. Another one bites the dust.",
          ])
        : "Checkmate. A tough way for the game to end.",
    };
  }

  if (POSITIVE.includes(i.classification)) {
    return { title, message: positiveMessage(i, { subj, subjCap, poss, pick }) };
  }
  if (i.classification === "book") {
    return { title, message: bookMessage(i, pick) };
  }
  if (i.classification === "forced") {
    return {
      title,
      message: "The only legal move here — nothing else to consider.",
    };
  }
  // inaccuracy / miss / mistake / blunder
  return { title, message: negativeMessage(i, { poss, possCap, subjCap }) };
}

function positiveMessage(
  i: CoachInput,
  ctx: { subj: string; subjCap: string; poss: string; pick: (a: string[]) => string },
): string {
  const m = i.played;
  const { subjCap, poss, pick } = ctx;

  if (i.classification === "brilliant") {
    const what = m?.sacrifice
      ? `a daring ${m ? NAME[m.piece] : "piece"} sacrifice`
      : "a stunning shot";
    return i.isPlayer
      ? pick([
          `Brilliant — ${what} that keeps you firmly on top!`,
          `Wow, ${what}! The engine's top pick and an absolute beauty.`,
        ])
      : `Careful — your opponent finds ${what} and stays right on top.`;
  }
  if (i.classification === "great") {
    const why = m?.threatPiece
      ? `hitting ${poss === "your" ? "their" : "your"} ${m.threatPiece}`
      : "the only move that holds everything together";
    return i.isPlayer
      ? pick([
          `That's what I'm talking about — ${why}. Clutch move under pressure.`,
          `Great find — ${why}. Well spotted!`,
        ])
      : `Strong from your opponent — ${why}. Stay sharp.`;
  }

  const s = i.isPlayer ? "" : "s"; // verb agreement: "you grab" vs "opponent grabs"

  if (m?.castle) {
    return `That castles ${m.castle}, tucking ${poss} king safely away.`;
  }
  if (m?.developsKingside) {
    return `That develops a piece and prepares kingside castling, protecting ${poss} king.`;
  }
  if (m?.develops) {
    return `Nice development — getting a piece into the game and eyeing the center.`;
  }
  if (m?.fork) {
    return `${subjCap} fork${s} two pieces at once — a tough one to deal with.`;
  }
  if (m?.threatPiece) {
    return `${subjCap} pile${s} pressure on the ${m.threatPiece}, winning a useful tempo.`;
  }
  if (m?.capture && m.capturedValue >= 3) {
    return `${subjCap} grab${s} a piece — material in the bank.`;
  }
  if (m?.centerPawn) {
    return `Stakes a claim in the center and frees up ${poss} pieces.`;
  }
  if (m?.check) {
    return `A check that keeps the enemy king on the run.`;
  }
  return pick([
    `A solid, healthy move that keeps ${poss} position humming.`,
    `Good stuff — nothing flashy, just a sound, sensible move.`,
  ]);
}

function bookMessage(i: CoachInput, pick: (a: string[]) => string): string {
  const m = i.played;
  if (m?.centerPawn) {
    return pick([
      `A classic — grabbing the center and opening up shop. Solid stuff.`,
      `Textbook opening play, staking out the middle of the board.`,
    ]);
  }
  if (m?.develops) {
    return `Good developing move — straight out of the book.`;
  }
  return pick([
    `A well-known book move. Theory has your back here.`,
    `Right out of the opening books — nothing to worry about.`,
  ]);
}

function negativeMessage(
  i: CoachInput,
  ctx: { poss: string; possCap: string; subjCap: string },
): string {
  const { poss, possCap } = ctx;
  const lead =
    i.classification === "inaccuracy"
      ? "A little imprecise."
      : i.classification === "miss"
        ? "A missed opportunity."
        : i.classification === "mistake"
          ? "That lets some advantage slip."
          : "Ouch — that one's costly.";

  // opponent's error that hands the player a chance
  if (!i.isPlayer && i.reply) {
    const gain = opportunityPhrase(i.reply);
    if (gain) return `${lead} Now you can ${gain}. Their loss, your gain.`;
  }

  const better = betterPhrase(i.best, i.bestSan);
  if (better) return `${lead} ${possCap} stronger move was to ${better}.`;
  if (i.bestSan) return `${lead} ${possCap} better move was ${i.bestSan}.`;
  return `${lead} There was a more accurate move available.`;
}

function opportunityPhrase(reply: Motifs): string | null {
  if (reply.capture && reply.capturedValue >= 3) return "win a piece";
  if (reply.capture && reply.capturedValue >= 1) return "win a pawn";
  if (reply.fork) return "win material with a fork";
  if (reply.threatPiece) return `win a tempo by hitting their ${reply.threatPiece}`;
  if (reply.check) return "pile in with a strong check";
  return null;
}

function betterPhrase(best: Motifs | null, bestSan: string | null): string | null {
  if (!best) return bestSan ? `play ${bestSan}` : null;
  if (best.sacrifice) return `sacrifice a ${NAME[best.piece]} for a strong attack`;
  if (best.fork) return "win material with a fork";
  if (best.capture && best.capturedValue >= 3) return "win a piece";
  if (best.capture && best.capturedValue >= 1) return "win a pawn";
  if (best.threatPiece) return `win a tempo by threatening the ${best.threatPiece}`;
  if (best.castle) return `castle ${best.castle} and get the king safe`;
  if (best.check) return "go for a forcing check";
  return bestSan ? `play ${bestSan}` : null;
}

/* ----------------------------- labels ----------------------------- */

function label(c: Classification): string {
  return {
    brilliant: "brilliant move",
    great: "great move",
    best: "best move",
    excellent: "excellent move",
    good: "good move",
    book: "book move",
    inaccuracy: "inaccuracy",
    miss: "miss",
    mistake: "mistake",
    blunder: "blunder",
    forced: "forced move",
  }[c];
}

function article(c: Classification): string {
  return ["excellent", "inaccuracy"].includes(c) ? "an" : "a";
}
