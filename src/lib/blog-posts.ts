export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-stockfish-game-review-works",
    title: "How Stockfish Game Review Works",
    description:
      "A plain-language look at how ChessDeeper uses Stockfish to grade every move in your games.",
    date: "2026-07-20",
    content: [
      "Every game you review on ChessDeeper is analyzed move-by-move by Stockfish, one of the strongest chess engines in the world. For each position in the game, the engine searches ahead many moves deep to work out the best available move and how much the evaluation shifts after the move that was actually played.",
      "That evaluation shift is what turns into the labels you see next to each move - Best, Excellent, Inaccuracy, Mistake, or Blunder. A small drop in evaluation might be an inaccuracy; a large one that hands the advantage to your opponent is a blunder.",
      "ChessDeeper runs Stockfish directly in your browser using WebAssembly, so no server-side computation or waiting in a queue is needed - analysis happens locally on your device as you step through the game.",
      "When your browser supports it, ChessDeeper uses a multi-threaded build of Stockfish that splits the search across several CPU cores for faster, deeper analysis. If that isn't available, it automatically falls back to a single-threaded version so the review still works, just a bit slower.",
    ],
  },
  {
    slug: "understanding-accuracy-percentage",
    title: "Understanding Your Chess Accuracy Percentage",
    description:
      "What that accuracy percentage next to your name actually measures, and why it isn't the same as your rating.",
    date: "2026-07-20",
    content: [
      "Accuracy percentage summarizes how closely your moves matched what the engine considered best, across an entire game. A 100% game means every move you played was the engine's top choice; lower percentages reflect moves that gave up some amount of advantage.",
      "It's easy to assume a higher rating always means higher accuracy, but that isn't quite right. A 2000-rated player pushing hard for a win in a sharp position might post a lower accuracy than a 1200-rated player playing a quiet, simple game - accuracy measures precision in that specific game, not overall skill.",
      "A useful way to use accuracy: track it over many of your own games rather than comparing single games to other players. If your average accuracy trends upward over weeks or months, that's a solid, concrete sign you're making fewer costly mistakes.",
    ],
  },
  {
    slug: "chesscom-vs-lichess-for-analysis",
    title: "Chess.com vs Lichess: Which Is Better for Analysis?",
    description:
      "Both platforms publish your game history through free public APIs - here's how they compare for post-game analysis.",
    date: "2026-07-20",
    content: [
      "Chess.com and Lichess both make your game history available through public APIs without requiring you to log in or authenticate - which is what lets a tool like ChessDeeper pull your games just from your username.",
      "Chess.com tends to have a larger player base and more casual and event games, which is useful if you want a broad sample of your recent play. Lichess's API is fully open-source and includes some additional metadata, like ratings history over time, out of the box.",
      "For analysis purposes, the underlying engine work is identical either way - ChessDeeper runs the same Stockfish review on games from both platforms, so the real difference comes down to which platform you actually play on, and which one has the games you want to review.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
