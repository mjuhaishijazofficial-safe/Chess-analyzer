<div align="center">

# ♞ ChessBuddy

### Your Chess.com stats, ratings, and games — analyzed by a real chess engine, right in your browser.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![Stockfish](https://img.shields.io/badge/Engine-Stockfish%2018%20NNUE-4ade80)](https://stockfishchess.org/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#license)

[Live Demo](#) · [Features](#-features) · [Screenshots](#-screenshots) · [Tech Stack](#-tech-stack) · [Installation](#-installation) · [Roadmap](#-future-improvements)

</div>

---

## 📖 About The Project

**ChessBuddy** is a modern, dark-themed analytics dashboard for [Chess.com](https://www.chess.com) players. Type in any public Chess.com username and instantly get a clean, terminal-styled breakdown of your profile, ratings, win/loss history, and recent games — no login, no OAuth, no API key required.

What makes ChessBuddy different from a typical stats tracker is its **built-in Game Review engine**: every game can be opened and analyzed move-by-move by **Stockfish 18 (NNUE)**, running entirely inside your browser. Every move gets classified (Brilliant, Best, Inaccuracy, Blunder, etc.), explained in plain English by an automated "coach," and scored for accuracy — the same experience you'd expect from Chess.com's own analysis board, but free, open-source, and self-hosted.

> ChessBuddy is an independent project and is **not affiliated with or endorsed by Chess.com**.

---

## ✨ Features

- 🔐 **Username-based login** — enter any Chess.com username; ChessBuddy verifies it against the live Published-Data API before opening the dashboard.
- 🧑‍💻 **Profile card** — avatar, title, country flag, league, followers, join date, and online status.
- 📊 **Ratings overview** — bullet / blitz / rapid / daily ratings, peak highs, W-D-L records, and win-rate bars.
- 📈 **Rating trend chart** — interactive, hand-built SVG line chart from real game history, switchable per time control, with hover tooltips.
- ♟️ **Recent games list** — latest games with result badges, opponents, time controls, filters, and direct links back to Chess.com.
- 🧠 **AI-style Game Review** — click any game to open a full engine analysis:
  - Step through every move on an interactive board
  - Live evaluation bar + best-move arrows
  - Moves graded **Brilliant `!!`**, **Great `!`**, **Best `★`**, Excellent, Good, Book, Inaccuracy `?!`, Miss `✗`, Mistake `?`, Blunder `??`
  - Plain-English coaching commentary for every move
  - Per-player **accuracy %**
- 🧩 **Puzzle saving** — save your own mistakes/blunders as puzzles to revisit and train on later.
- ⚡ **Runs 100% client-side analysis** — no backend, no API key, no per-user server cost for the engine.

---

## 🖼️ Screenshots

<div align="center">

| Dashboard | Game Review |
|---|---|
| ![Dashboard screenshot](docs/screenshots/dashboard.png) | ![Game review screenshot](docs/screenshots/game-review.png) |

| Rating Trend | Move Classification |
|---|---|
| ![Rating chart screenshot](docs/screenshots/rating-chart.png) | ![Move classification screenshot](docs/screenshots/move-classification.png) |

</div>

> 📌 *Add your own screenshots to `docs/screenshots/` and update the paths above — this makes a huge difference for first impressions.*

---

## 🎬 Demo

<div align="center">

![ChessBuddy demo GIF](docs/screenshots/demo.gif)

</div>

> 📌 *Record a short screen capture (e.g. with [ScreenToGif](https://www.screentogif.com/) or [Kap](https://getkap.co/)) showing: entering a username → dashboard loading → opening a game → engine analysis running. Save it as `docs/screenshots/demo.gif`.*

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Server Components, Route Handlers) |
| UI | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) — custom dark "engine/terminal" theme |
| Chess logic | [chess.js](https://github.com/jhlywa/chess.js) for PGN parsing + move legality |
| Chess engine | [Stockfish 18 NNUE (WASM)](https://stockfishchess.org/) in a Web Worker — multi-threaded when cross-origin isolated, with single-threaded and asm.js fallbacks |
| Data source | [Chess.com Published-Data API](https://www.chess.com/news/view/published-data-api) — no key required |
| Charts / Board | Zero external chart or board libraries — everything is hand-built, responsive SVG |
| Testing | [Vitest](https://vitest.dev/) |

---

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18.18+ (LTS recommended)
- npm (comes with Node.js)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/mjuhaishijazofficial-safe/Chess-analyzer.git
cd Chess-analyzer

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
npm run build
npm run start
```

### Running tests

```bash
npm run test
```

No environment variables or API keys are required — all Chess.com data is fetched server-side using the public API, and the chess engine runs entirely client-side.

---

## 📁 Folder Structure

```
src/
  app/
    page.tsx                              # Landing page + connect form
    player/[username]/page.tsx            # Main dashboard (server component)
    player/[username]/game/[uuid]/page.tsx # Game review page (server shell)
    api/verify/[username]/route.ts        # Username existence check
  components/                             # Header, footer, profile, rating cards,
                                           # rating chart, games table, login form,
                                           # board, eval bar, move list, game review
  lib/
    chesscom.ts                           # Typed Chess.com API client + caching
    format.ts                             # Dates, results, flags, view helpers
    engine.ts                             # Stockfish 18 UCI Web Worker driver (MT/ST)
    chess-review.ts                       # Win %, move classification, accuracy
    coach.ts                              # Motif detection + plain-English commentary
    puzzle-store.ts                       # Local puzzle saving (localStorage)
public/
  engine/                                 # Self-hosted Stockfish 18 NNUE WASM builds
```

All Chess.com API calls run **server-side** (no CORS issues, no exposed keys) and use Next.js's fetch cache (`revalidate`), so repeat visits are fast and gentle on the API.

---

## 🗺️ Future Improvements

- [ ] Cloud sync for saved puzzles (currently stored in browser `localStorage` only)
- [ ] Head-to-head comparison mode between two players
- [ ] Opening repertoire builder based on a player's most-played openings
- [ ] Downloadable PDF/PNG game review reports
- [ ] Support for Lichess accounts alongside Chess.com
- [ ] Dark/light theme toggle
- [ ] Mobile app wrapper (PWA support)
- [ ] User accounts for cross-device puzzle history

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/mjuhaishijazofficial-safe/Chess-analyzer/issues) or open a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

ChessBuddy is an independent project and is **not affiliated with or endorsed by Chess.com**.

</div>
