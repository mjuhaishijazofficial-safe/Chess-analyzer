"use client";

// src/components/opening-search.tsx
//
// Hero search bar for the Opening Explorer. Styled as an "engine console":
// a command-line prompt on top, results streaming below like PV lines from
// an analysis engine — numbered, with the ECO code in monospace and the
// opening name in a serif "book" face (nod to classic opening manuals).
//
// Drop-in usage:
//   <OpeningSearch
//     dataset={openings}
//     onSelect={(o) => router.push(`/openings/${o.id}`)}
//   />

import { useEffect, useMemo, useRef, useState } from "react";
import { searchOpenings, detectQueryKind } from "@/lib/opening-search";
import type { OpeningSummary, SearchMatch } from "@/types/opening";

interface OpeningSearchProps {
  dataset: OpeningSummary[];
  onSelect?: (opening: OpeningSummary) => void;
  placeholder?: string;
}

const KIND_LABEL: Record<string, string> = {
  eco: "ECO code",
  moves: "move sequence",
  name: "name",
};

function highlight(text: string, needle: string) {
  if (!needle.trim()) return text;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-[var(--oe-accent)]">
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

export function OpeningSearch({
  dataset,
  onSelect,
  placeholder = "Search by name, ECO code, or moves…",
}: OpeningSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const kind = useMemo(() => detectQueryKind(query), [query]);
  const results: SearchMatch[] = useMemo(
    () => searchOpenings(query, dataset),
    [query, dataset]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function commit(opening: OpeningSummary) {
    onSelect?.(opening);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative w-full max-w-2xl mx-auto"
      style={
        {
          "--oe-bg": "#0b0d0f",
          "--oe-panel": "#14171a",
          "--oe-border": "#262b2f",
          "--oe-text": "#e8e6e1",
          "--oe-muted": "#838b93",
          "--oe-accent": "#c9a869",
          "--oe-win": "#4ea672",
          "--oe-loss": "#c1554d",
        } as React.CSSProperties
      }
    >
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
        style={{
          background: "var(--oe-panel)",
          borderColor: isOpen ? "var(--oe-accent)" : "var(--oe-border)",
        }}
      >
        <span
          className="font-mono text-sm select-none"
          style={{ color: "var(--oe-accent)" }}
          aria-hidden
        >
          ›
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="opening-search-results"
          aria-autocomplete="list"
          className="flex-1 bg-transparent outline-none font-mono text-[15px] placeholder:opacity-50"
          style={{ color: "var(--oe-text)" }}
        />
        {query && (
          <span
            className="hidden sm:inline text-xs font-mono px-2 py-1 rounded-md"
            style={{ color: "var(--oe-muted)", background: "var(--oe-bg)" }}
          >
            {KIND_LABEL[kind]}
          </span>
        )}
      </div>

      {isOpen && query.trim() && (
        <div
          id="opening-search-results"
          role="listbox"
          className="absolute z-20 mt-2 w-full rounded-xl border overflow-hidden shadow-2xl"
          style={{ background: "var(--oe-panel)", borderColor: "var(--oe-border)" }}
        >
          {results.length === 0 ? (
            <p
              className="px-4 py-4 text-sm font-mono"
              style={{ color: "var(--oe-muted)" }}
            >
              No openings match &ldquo;{query}&rdquo;. Try a name, an ECO code
              like C50, or a move string like &ldquo;e4 e5 Nf3&rdquo;.
            </p>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      background: i === activeIndex ? "var(--oe-bg)" : "transparent",
                      borderTop: i === 0 ? "none" : "1px solid var(--oe-border)",
                    }}
                  >
                    <span
                      className="font-mono text-xs w-6 shrink-0 text-right"
                      style={{ color: "var(--oe-muted)" }}
                    >
                      {i + 1}.
                    </span>

                    <span
                      className="font-mono text-xs px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        color: "var(--oe-accent)",
                        border: "1px solid var(--oe-border)",
                      }}
                    >
                      {r.eco}
                    </span>

                    <span
                      className="font-serif text-[15px] flex-1 truncate"
                      style={{ color: "var(--oe-text)" }}
                    >
                      {highlight(r.name, r.matchType === "name" ? r.matchedText : "")}
                    </span>

                    {r.trending && (
                      <span
                        className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
                        style={{ color: "var(--oe-win)", border: "1px solid var(--oe-win)" }}
                      >
                        trending
                      </span>
                    )}

                    <span
                      className="font-mono text-xs shrink-0 w-10 text-right"
                      style={{ color: "var(--oe-muted)" }}
                    >
                      {r.popularity}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div
            className="px-4 py-2 text-[11px] font-mono flex items-center justify-between"
            style={{ borderTop: "1px solid var(--oe-border)", color: "var(--oe-muted)" }}
          >
            <span>↑↓ navigate · ↵ select · esc close</span>
            <span>{results.length} match{results.length === 1 ? "" : "es"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
