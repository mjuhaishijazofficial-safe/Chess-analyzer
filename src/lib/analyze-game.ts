import { Chess } from "chess.js";
import { Engine } from "./engine";
import { bookPlies } from "./opening-book";
import { detectMotifs } from "./coach";
import {
  classifyMove,
  cpStm,
  material,
  type Classification,
  type MoveReview,
} from "./chess-review";

export interface ParsedGame {
  moves: MoveReview[];
  startFen: string;
  error: boolean;
}

/** Parse a PGN into an (unanalyzed) move list. Mirrors game-review.tsx's parser. */
export function parseGamePgn(pgn: string): ParsedGame {
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

/**
 * Run one already-ready Engine across every move of a game and classify each
 * one (book / good / inaccuracy / mistake / blunder / …). No board rendering,
 * no coaching text — just the data, so many games can be walked back to back.
 * Pass the same Engine instance across games to avoid re-initializing Stockfish.
 */
export async function analyzeGameMoves(
  pgn: string,
  engine: Engine,
  movetime: number,
  onProgress?: (done: number, total: number) => void,
): Promise<MoveReview[]> {
  const parsed = parseGamePgn(pgn);
  if (parsed.error || parsed.moves.length === 0) return [];

  const working = parsed.moves.map((m) => ({ ...m }));
  const N = working.length;
  const posStm: number[] = [];
  const posSecond: (number | null)[] = [];
  const posBest: (string | null)[] = [];

  for (let k = 0; k <= N; k++) {
    const fen = k === 0 ? parsed.startFen : working[k - 1].fenAfter;

    const probe = new Chess(fen);
    let stm = 0;
    let second: number | null = null;
    let best: string | null = null;
    if (probe.isCheckmate()) {
      stm = -100000;
    } else if (probe.isStalemate() || probe.isDraw()) {
      stm = 0;
    } else {
      const ev = await engine.analyze(fen, { movetime });
      stm = cpStm(ev.lines[0]);
      second = ev.lines[1] ? cpStm(ev.lines[1]) : null;
      best = ev.bestMove ?? ev.lines[0]?.move ?? null;
    }
    posStm[k] = stm;
    posSecond[k] = second;
    posBest[k] = best;

    if (k > 0) {
      const whiteToMove = fen.split(" ")[1] === "w";
      const whiteCp = whiteToMove ? stm : -stm;
      const mv = working[k - 1];
      mv.evalWhiteCp = whiteCp;

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
        bestUci: posBest[k - 1],
        bestCpStm: posStm[k - 1],
        secondCpStm: posSecond[k - 1],
        moverAfterCp: -stm,
        legalCount,
        sacrifice,
        bookMatchPlies,
      });

      let cls: Classification = res.classification;
      if (cls === "mistake" || cls === "inaccuracy") {
        const bestMotifs = posBest[k - 1] ? detectMotifs(mv.fenBefore, posBest[k - 1]!) : null;
        if (
          bestMotifs &&
          (bestMotifs.fork ||
            bestMotifs.sacrifice ||
            (bestMotifs.capture && bestMotifs.capturedValue >= 2) ||
            (!!bestMotifs.threatPiece && res.winDrop >= 6))
        ) {
          cls = "miss";
        }
      }

      mv.bestUci = posBest[k - 1];
      mv.bestSan = posBest[k - 1] ? uciToSan(mv.fenBefore, posBest[k - 1]!) : null;
      mv.classification = cls;
      mv.winDrop = res.winDrop;
      mv.accuracy = res.accuracy;
      mv.analyzed = true;
    }

    onProgress?.(k, N);
  }

  return working;
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
