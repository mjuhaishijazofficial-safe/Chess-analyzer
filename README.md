# ♞ ChessBuddy

A modern **Next.js** dashboard for the [Chess.com public API](https://www.chess.com/news/view/published-data-api). "Log in" with your Chess.com username and ChessBuddy fetches your **profile, ratings, win/loss records and recent games** into one clean, dark, terminal-styled analytics view.

![stack](https://img.shields.io/badge/Next.js-16-black) ![stack](https://img.shields.io/badge/React-19-149eca) ![stack](https://img.shields.io/badge/Tailwind-v4-38bdf8)

## What it does

- **Username login** — enter any Chess.com username; ChessBuddy verifies it against the live API before opening the dashboard.
- **Profile card** — avatar, title, country flag, league, followers, join date and online status.
- **Ratings** — bullet / blitz / rapid / daily current ratings, peak highs, W-D-L records and win-rate bars.
- **Rating trend** — an interactive SVG line chart built from your real recent game history, switchable per time control, with hover tooltips.
- **Recent games** — your latest games with result badges, opponents, time controls and direct links back to Chess.com, filterable by result and format.
- **Game Review** — click any game to open a full Stockfish-style review: step through every move on an interactive board, see an evaluation bar, engine best-move arrows, and each move graded **Best / Excellent / Good / Inaccuracy / Mistake / Blunder** with a plain-English explanation, plus per-player **accuracy %**.

## Game Review (Stockfish 18 in your browser)

Open any standard game from the dashboard (or visit `/player/<name>/game/<uuid>`). ChessBuddy parses the PGN with `chess.js` and runs **Stockfish 18 (NNUE)** in a Web Worker — analysis happens entirely on your machine, no backend or API key:

- **Multi-threaded** build (`stockfish-18-lite.js`) when the page is cross-origin isolated (COOP/COEP headers in [next.config.ts](next.config.ts) enable `SharedArrayBuffer`), using up to N-1 CPU threads,
- **single-threaded** build (`stockfish-18-lite-single.js`) as an automatic fallback for browsers without isolation (e.g. Safari),
- a 2019 asm.js build as a final safety net.

It analyzes every position (MultiPV 2, ~0.3s/move) and produces a **chess.com-style review**:

- a friendly **coach card** that explains each move in plain English ("That develops a piece and prepares kingside castling…", "A missed opportunity — their stronger move was to win a tempo by threatening the bishop"),
- each move **classified** — Brilliant `!!`, Great `!`, Best `★`, Excellent/Good, Book, Inaccuracy `?!`, Miss `✗`, Mistake `?`, Blunder `??` — with a colored **badge on the board square**,
- an **eval bar** + score, a **best-move arrow**, the engine's **best line**, and per-side **accuracy %**.

Move classification is derived from the win-probability swing each move causes, with Brilliant/Great detected via the gap to the 2nd-best move (MultiPV) and material sacrifices, and the coach's commentary built from motif detection (captures, checks, castling, central control, development, threats, forks). Navigate with the on-screen controls or the keyboard (`←/→` step, `Home/End` jump, `f` flip board).

## Why "username" and not OAuth?

Chess.com's OAuth program is **invite-only** and not available to general apps. The public **Published-Data API** exposes profile, stats and game data with no key required — so "login" here means identifying yourself by your public username. Only data already visible on your Chess.com profile is ever shown.

## Tech

- **Next.js 16** (App Router, Server Components, Route Handlers)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** with a custom dark "engine/terminal" theme
- **chess.js** for PGN parsing + legality; **Stockfish 18 NNUE (WASM)** in a Web Worker for analysis (multi-threaded when isolated, single-threaded fallback)
- Zero external chart/board libraries — the rating chart, eval bar and board are hand-built responsive SVG.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production
```

## How it's structured

```
src/
  app/
    page.tsx                              # landing + connect form
    player/[username]/page.tsx            # the dashboard (server component)
    player/[username]/game/[uuid]/page.tsx # the game review (server shell)
    api/verify/[username]/route.ts        # username existence check
  components/                             # header, footer, profile, rating cards,
                                          # rating chart, games table, login form,
                                          # board, eval bar, move list, game review
  lib/
    chesscom.ts                           # typed Chess.com API client + caching
    format.ts                             # dates, results, flags, view helpers
    engine.ts                             # Stockfish 18 UCI Web Worker driver (MT/ST)
    chess-review.ts                       # win%, move classification, accuracy
    coach.ts                              # motif detection + plain-English commentary
public/engine/                            # self-hosted Stockfish 18 NNUE WASM builds
```

All Chess.com calls run **server-side** (no CORS, no exposed keys) and use Next's fetch cache (`revalidate`), so repeat visits are fast and gentle on the API.

---

ChessBuddy is an independent project and is **not affiliated with or endorsed by Chess.com**.
