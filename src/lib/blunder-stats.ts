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

export interface OpeningStat {
  label: string;
  mistakes: number;
  blunders: number;
  total: number;
}

export interface BlunderReport {
  gamesAnalyzed: number;
  movesAnalyzed: number;
  byPhase: Record<Phase, { mistakes: number; blunders: number }>;
  /** Openings where the same kind of error (mistake/blunder) showed up
   *  more than once across the analyzed games, worst first. Empty when
   *  the sample size is too small to call anything "recurring" yet. */
  byOpening: OpeningStat[];
  samples: BlunderSample[]; // a handful of the worst moves, for illustration
}

const ENDGAME_MATERIAL_THRESHOLD = 24; // combined non-king material, both sides

/** Minimum times a mistake/blunder must repeat under the same opening
 *  before we call it "recurring" rather than a one-off. */
const RECURRING_THRESHOLD = 2;

function phaseFor(mv: MoveReview, openingPlies: number): Phase {
  if (mv.ply <= openingPlies) return "opening";
  const combined = material(mv.fenBefore, "w") + material(mv.fenBefore, "b");
  if (combined <= ENDGAME_MATERIAL_THRESHOLD) return "endgame";
  return "middlegame";
}

/**
 * Chess.com's `eco` field is a URL like
 * "https://www.chess.com/openings/Sicilian-Defense-Najdorf-6.Bg5-e6" —
 * not a bare opening name. This pulls out just the opening family name
 * (stopping at the first move-notation token, e.g. "6.Bg5") so that
 * different exact move orders of the same opening still group together.
 */
export function openingFamilyFromEco(eco: string | null | undefined): string | null {
  if (!eco) return null;
  const slug = eco.split("/openings/")[1] ?? eco.split("/").pop();
  if (!slug) return null;

  const words: string[] = [];
  for (const w of slug.split("-")) {
    if (/\d/.test(w)) break; // stop at the first move token, e.g. "6.Bg5"
    words.push(w);
  }
  const name = words.join(" ").trim();
  return name || null;
}

/**
 * Given the analyzed moves for one player across several games, tally how
 * many mistakes/blunders happened in each phase of the game and in each
 * opening, plus a few worked examples of the worst ones.
 */
export function aggregateBlunders(
  games: {
    url: string;
    playerColor: "w" | "b";
    moves: MoveReview[];
    eco?: string | null;
  }[],
): BlunderReport {
  const byPhase: Record<Phase, { mistakes: number; blunders: number }> = {
    opening: { mistakes: 0, blunders: 0 },
    middlegame: { mistakes: 0, blunders: 0 },
    endgame: { mistakes: 0, blunders: 0 },
  };
  const openingCounts = new Map<string, { mistakes: number; blunders: number }>();
  const samples: BlunderSample[] = [];
  let movesAnalyzed = 0;

  for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
    const game = games[gameIndex];
    const sanAll = game.moves.map((m) => m.san);
    const openingPlies = bookPlies(sanAll);
    const openingLabel = openingFamilyFromEco(game.eco);

    for (const mv of game.moves) {
      if (mv.color !== game.playerColor || !mv.analyzed) continue;
      movesAnalyzed++;

      const cls = mv.classification;
      if (cls !== "mistake" && cls !== "blunder" && cls !== "miss") continue;

      const phase = phaseFor(mv, openingPlies);
      if (cls === "blunder") byPhase[phase].blunders++;
      else byPhase[phase].mistakes++;

      if (openingLabel) {
        const entry = openingCounts.get(openingLabel) ?? { mistakes: 0, blunders: 0 };
        if (cls === "blunder") entry.blunders++;
        else entry.mistakes++;
        openingCounts.set(openingLabel, entry);
      }

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

  const byOpening: OpeningStat[] = Array.from(openingCounts.entries())
    .map(([label, c]) => ({ label, ...c, total: c.mistakes + c.blunders }))
    .filter((o) => o.total >= RECURRING_THRESHOLD)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    gamesAnalyzed: games.length,
    movesAnalyzed,
    byPhase,
    byOpening,
    samples: samples.slice(0, 8),
  };
}