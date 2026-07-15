import { bookPlies } from "./opening-book";
import { material, type MoveReview } from "./chess-review";

export type Phase = "opening" | "middlegame" | "endgame";

export interface BlunderSample {
  gameIndex: number;
  gameUrl: string;
  ply: number;
  moveNo: number;
  san: string;
  bestSan: string | null;
  phase: Phase;
  winDrop: number;
  /** Everything needed to turn this sample into a saved puzzle. */
  fen: string;
  playerUci: string;
  bestUci: string | null;
}

export interface BlunderReport {
  gamesAnalyzed: number;
  movesAnalyzed: number;
  byPhase: Record<Phase, { mistakes: number; blunders: number }>;
  samples: BlunderSample[]; // a handful of the worst moves, for illustration
}

const ENDGAME_MATERIAL_THRESHOLD = 24; // combined non-king material, both sides

function phaseFor(mv: MoveReview, openingPlies: number): Phase {
  if (mv.ply <= openingPlies) return "opening";
  const combined = material(mv.fenBefore, "w") + material(mv.fenBefore, "b");
  if (combined <= ENDGAME_MATERIAL_THRESHOLD) return "endgame";
  return "middlegame";
}

/**
 * Given the analyzed moves for one player across several games, tally how
 * many mistakes/blunders happened in each phase of the game, plus a few
 * worked examples of the worst ones.
 */
export function aggregateBlunders(
  games: { url: string; playerColor: "w" | "b"; moves: MoveReview[] }[],
): BlunderReport {
  const byPhase: Record<Phase, { mistakes: number; blunders: number }> = {
    opening: { mistakes: 0, blunders: 0 },
    middlegame: { mistakes: 0, blunders: 0 },
    endgame: { mistakes: 0, blunders: 0 },
  };
  const samples: BlunderSample[] = [];
  let movesAnalyzed = 0;

  for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
    const game = games[gameIndex];
    const sanAll = game.moves.map((m) => m.san);
    const openingPlies = bookPlies(sanAll);

    for (const mv of game.moves) {
      if (mv.color !== game.playerColor || !mv.analyzed) continue;
      movesAnalyzed++;

      const cls = mv.classification;
      if (cls !== "mistake" && cls !== "blunder" && cls !== "miss") continue;

      const phase = phaseFor(mv, openingPlies);
      if (cls === "blunder") byPhase[phase].blunders++;
      else byPhase[phase].mistakes++;

      samples.push({
        gameIndex,
        gameUrl: game.url,
        ply: mv.ply,
        moveNo: mv.moveNo,
        san: mv.san,
        bestSan: mv.bestSan,
        phase,
        winDrop: mv.winDrop ?? 0,
        fen: mv.fenBefore,
        playerUci: mv.uci,
        bestUci: mv.bestUci,
      });
    }
  }

  samples.sort((a, b) => b.winDrop - a.winDrop);

  return {
    gamesAnalyzed: games.length,
    movesAnalyzed,
    byPhase,
    samples: samples.slice(0, 8),
  };
}
