"use client";

import { useEffect, useState } from "react";
import { Board } from "@/components/board";
import { PIECE_SETS, getPieceSet, setPieceSet, type PieceSet } from "@/lib/piece-set";
import { BOARD_THEMES, getBoardTheme, setBoardTheme, type BoardThemeName } from "@/lib/board-theme";
import {
  isSoundEnabled,
  setSoundEnabled,
  playMoveSound,
  playCaptureSound,
  playCheckSound,
} from "@/lib/sound";
import {
  getAnalysisDepth,
  setAnalysisDepth,
  ANALYSIS_DEPTHS,
  type AnalysisDepth,
} from "@/lib/analysis-depth";

const PREVIEW_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function SettingsPage() {
  const [selected, setSelected] = useState<PieceSet>("cburnett");
  const [boardSelected, setBoardSelected] = useState<BoardThemeName>("slate");
  const [soundOn, setSoundOn] = useState(true);
  const [speed, setSpeed] = useState<AnalysisDepth>("balanced");

  useEffect(() => {
    setSelected(getPieceSet());
    setBoardSelected(getBoardTheme().name);
    setSoundOn(isSoundEnabled());
    setSpeed(getAnalysisDepth());
  }, []);

  const previewTheme = BOARD_THEMES.find((t) => t.name === boardSelected) ?? BOARD_THEMES[0];

  function choose(set: PieceSet) {
    setPieceSet(set);
    setSelected(set);
  }

  function chooseBoard(name: BoardThemeName) {
    setBoardTheme(name);
    setBoardSelected(name);
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playMoveSound();
  }

  function chooseSpeed(next: AnalysisDepth) {
    setAnalysisDepth(next);
    setSpeed(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <h1 className="mb-6 text-2xl font-bold text-fg">Board Color</h1>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {BOARD_THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => chooseBoard(t.name)}
                className={`rounded-xl border p-3 text-center transition ${
                  boardSelected === t.name
                    ? "border-accent bg-accent/10"
                    : "border-line bg-panel hover:border-line-strong"
                }`}
              >
                <div className="mx-auto mb-2 grid h-16 w-16 grid-cols-2 grid-rows-2 overflow-hidden rounded-md border border-line">
                  <div style={{ background: t.light }} />
                  <div style={{ background: t.dark }} />
                  <div style={{ background: t.dark }} />
                  <div style={{ background: t.light }} />
                </div>
                <span className="text-sm capitalize text-fg">{t.name}</span>
              </button>
            ))}
          </div>

          <h1 className="mb-6 mt-12 text-2xl font-bold text-fg">Piece Style</h1>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PIECE_SETS.map((set) => (
              <button
                key={set}
                onClick={() => choose(set)}
                className={`rounded-xl border p-4 text-center transition ${
                  selected === set
                    ? "border-accent bg-accent/10"
                    : "border-line bg-panel hover:border-line-strong"
                }`}
              >
                <img
                  src={`https://lichess1.org/assets/piece/${set}/wN.svg`}
                  alt={set}
                  className="mx-auto mb-2 h-16 w-16"
                />
                <span className="text-sm capitalize text-fg">{set}</span>
              </button>
            ))}
          </div>
          <h1 className="mb-6 mt-12 text-2xl font-bold text-fg">Sound Effects</h1>
          <div className="flex items-center justify-between rounded-xl border border-line bg-panel p-4">
            <div>
              <p className="text-sm font-medium text-fg">Move &amp; capture sounds</p>
              <p className="mt-0.5 text-sm text-muted">
                Plays a click on moves, a thud on captures, and an alert on check.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={soundOn}
              onClick={toggleSound}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                soundOn ? "border-accent bg-accent/80" : "border-line bg-panel-2"
              }`}
            >
              <span
                className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
                style={{
                  height: "1.375rem",
                  width: "1.375rem",
                  transform: soundOn ? "translateX(22px)" : "translateX(2px)",
                }}
              />
            </button>
          </div>

          {soundOn && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={playMoveSound}
                className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fg hover:border-line-strong"
              >
                ▶ Move
              </button>
              <button
                onClick={playCaptureSound}
                className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fg hover:border-line-strong"
              >
                ▶ Capture
              </button>
              <button
                onClick={playCheckSound}
                className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fg hover:border-line-strong"
              >
                ▶ Check
              </button>
            </div>
          )}

          <h1 className="mb-2 mt-12 text-2xl font-bold text-fg">Analysis Speed</h1>
          <p className="mb-6 text-sm text-muted">
            How long Stockfish thinks per position in Game Review and Puzzles.
            Balanced is fast enough for everyday review; Deep is slower but stronger.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ANALYSIS_DEPTHS.map((d) => (
              <button
                key={d.value}
                onClick={() => chooseSpeed(d.value)}
                className={`rounded-xl border p-4 text-left transition ${
                  speed === d.value
                    ? "border-accent bg-accent/10"
                    : "border-line bg-panel hover:border-line-strong"
                }`}
              >
                <p className="text-sm font-semibold text-fg">
                  {d.label}
                  {d.value === "balanced" && (
                    <span className="ml-2 text-xs font-normal text-muted">Default</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted">{d.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        {/* live preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
            Preview
          </p>
          <div className="w-full max-w-[280px]">
            <Board
              fen={PREVIEW_FEN}
              themeOverride={previewTheme}
              pieceSetOverride={selected}
            />
          </div>
          <p className="mt-3 text-sm text-muted">
            <span className="capitalize">{previewTheme.name}</span> board ·{" "}
            <span className="capitalize">{selected}</span> pieces
          </p>
        </div>
      </div>
    </div>
  );
}