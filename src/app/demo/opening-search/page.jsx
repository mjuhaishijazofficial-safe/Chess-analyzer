import { useEffect, useMemo, useRef, useState } from "react";

const SAMPLE = [
  { id: "italian-game", name: "Italian Game", eco: "C50", moves: "e4 e5 Nf3 Nc6 Bc4", popularity: 92, trending: true },
  { id: "ruy-lopez", name: "Ruy Lopez", eco: "C60", moves: "e4 e5 Nf3 Nc6 Bb5", popularity: 88 },
  { id: "sicilian-najdorf", name: "Sicilian Defense: Najdorf Variation", eco: "B90", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6", popularity: 95, trending: true },
  { id: "sicilian-dragon", name: "Sicilian Defense: Dragon Variation", eco: "B70", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6", popularity: 74 },
  { id: "french-defense", name: "French Defense", eco: "C00", moves: "e4 e6", popularity: 68 },
  { id: "caro-kann", name: "Caro-Kann Defense", eco: "B10", moves: "e4 c6", popularity: 65 },
  { id: "queens-gambit", name: "Queen's Gambit", eco: "D06", moves: "d4 d5 c4", popularity: 90, trending: true },
  { id: "kings-indian", name: "King's Indian Defense", eco: "E60", moves: "d4 Nf6 c4 g6", popularity: 79 },
  { id: "nimzo-indian", name: "Nimzo-Indian Defense", eco: "E20", moves: "d4 Nf6 c4 e6 Nc3 Bb4", popularity: 81 },
  { id: "english-opening", name: "English Opening", eco: "A10", moves: "c4", popularity: 71 },
  { id: "kings-gambit", name: "King's Gambit", eco: "C30", moves: "e4 e5 f4", popularity: 40 },
  { id: "scotch-game", name: "Scotch Game", eco: "C45", moves: "e4 e5 Nf3 Nc6 d4", popularity: 60 },
];

const ECO_PATTERN = /^[a-e]\d{0,2}$/i;
const MOVE_TOKEN_PATTERN = /^[a-h1-8nbrqkoNBRQKO0-9x+#=-]+$/;

function detectQueryKind(query) {
  const trimmed = query.trim();
  if (!trimmed) return "name";
  if (ECO_PATTERN.test(trimmed)) return "eco";
  const tokens = trimmed.split(/\s+/);
  if (tokens.length > 1 && tokens.every((t) => MOVE_TOKEN_PATTERN.test(t))) return "moves";
  return "name";
}

function searchOpenings(query, dataset, limit = 8) {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const kind = detectQueryKind(trimmed);
  const lower = trimmed.toLowerCase();
  const results = [];
  for (const o of dataset) {
    if (kind === "eco" && o.eco.toLowerCase().startsWith(lower)) {
      results.push({ ...o, matchType: "eco", matchedText: o.eco });
    } else if (kind === "moves" && o.moves.toLowerCase().startsWith(lower)) {
      results.push({ ...o, matchType: "moves", matchedText: o.moves });
    } else if (kind === "name" && o.name.toLowerCase().includes(lower)) {
      results.push({ ...o, matchType: "name", matchedText: o.name });
    }
  }
  return results.sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

const COLORS = {
  bg: "#0b0d0f",
  panel: "#14171a",
  border: "#262b2f",
  text: "#e8e6e1",
  muted: "#838b93",
  accent: "#c9a869",
  win: "#4ea672",
};

const KIND_LABEL = { eco: "ECO code", moves: "move sequence", name: "name" };

function Highlight({ text, needle }) {
  if (!needle.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: COLORS.accent }}>{text.slice(idx, idx + needle.length)}</span>
      {text.slice(idx + needle.length)}
    </>
  );
}

export default function OpeningSearchPreview() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);

  const kind = useMemo(() => detectQueryKind(query), [query]);
  const results = useMemo(() => searchOpenings(query, SAMPLE), [query]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleKeyDown(e) {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "480px",
        padding: "48px 24px",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: "ui-monospace, monospace", letterSpacing: 1, marginBottom: 20, textTransform: "uppercase" }}>
        Opening Explorer
      </p>

      <div ref={rootRef} style={{ position: "relative", width: "100%", maxWidth: 560 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 12,
            border: `1px solid ${isOpen ? COLORS.accent : COLORS.border}`,
            background: COLORS.panel,
            padding: "14px 16px",
            transition: "border-color 150ms ease",
          }}
        >
          <span style={{ color: COLORS.accent, fontFamily: "ui-monospace, monospace" }}>›</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, ECO code, or moves…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: COLORS.text,
              fontFamily: "ui-monospace, monospace",
              fontSize: 15,
            }}
          />
          {query && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "ui-monospace, monospace",
                color: COLORS.muted,
                background: COLORS.bg,
                padding: "4px 8px",
                borderRadius: 6,
              }}
            >
              {KIND_LABEL[kind]}
            </span>
          )}
        </div>

        {isOpen && query.trim() && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              zIndex: 20,
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            {results.length === 0 ? (
              <p style={{ padding: "16px", fontSize: 13, color: COLORS.muted, fontFamily: "ui-monospace, monospace", margin: 0 }}>
                No openings match "{query}". Try a name, an ECO code like C50, or a move string like "e4 e5 Nf3".
              </p>
            ) : (
              results.map((r, i) => (
                <button
                  key={r.id}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => setQuery(r.name)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    textAlign: "left",
                    background: i === activeIndex ? COLORS.bg : "transparent",
                    border: "none",
                    borderTop: i === 0 ? "none" : `1px solid ${COLORS.border}`,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ width: 20, textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: 12, color: COLORS.muted, flexShrink: 0 }}>
                    {i + 1}.
                  </span>
                  <span
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 12,
                      color: COLORS.accent,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 4,
                      padding: "2px 6px",
                      flexShrink: 0,
                    }}
                  >
                    {r.eco}
                  </span>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: COLORS.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <Highlight text={r.name} needle={r.matchType === "name" ? r.matchedText : ""} />
                  </span>
                  {r.trending && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "ui-monospace, monospace",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: COLORS.win,
                        border: `1px solid ${COLORS.win}`,
                        borderRadius: 4,
                        padding: "2px 6px",
                        flexShrink: 0,
                      }}
                    >
                      trending
                    </span>
                  )}
                  <span style={{ width: 40, textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: 12, color: COLORS.muted, flexShrink: 0 }}>
                    {r.popularity}%
                  </span>
                </button>
              ))
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 16px",
                fontSize: 11,
                fontFamily: "ui-monospace, monospace",
                color: COLORS.muted,
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <span>↑↓ navigate · click to select · esc close</span>
              <span>{results.length} match{results.length === 1 ? "" : "es"}</span>
            </div>
          </div>
        )}
      </div>

      <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: "ui-monospace, monospace", marginTop: 24 }}>
        try: "sicilian" · "C50" · "e4 e5"
      </p>
    </div>
  );
}
