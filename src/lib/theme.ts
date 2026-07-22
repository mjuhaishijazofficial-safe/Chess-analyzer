export const THEMES = ["terminal", "club", "midnight", "aurora", "arctic", "forest"] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "chessdeeper-theme";
const DEFAULT_THEME: Theme = "terminal";

export function getTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return (THEMES as readonly string[]).includes(saved ?? "") ? (saved as Theme) : DEFAULT_THEME;
}

export function setTheme(theme: Theme) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  // Re-apply the current light/dark preference so the newly picked theme
  // shows its own light or dark variant, instead of losing the setting.
  applyMode(getMode(theme));
}

export function applyTheme(theme: Theme) {
  if (theme === "terminal") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

// ------------------------------------------------------------------
// Light / Dark mode — independent of *which* theme is picked. Every
// theme has both a dark and a light palette (see globals.css). This
// only tracks which one to show. Themes are dark by default, except
// Forest, which is light by default.
// ------------------------------------------------------------------
export type Mode = "dark" | "light";
const MODE_STORAGE_KEY = "chessdeeper-mode";

/** The mode a theme shows if the user has never toggled it. */
export function naturalMode(theme: Theme): Mode {
  return theme === "forest" ? "light" : "dark";
}

function savedMode(): Mode | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : null;
}

/** Current mode for a theme — the user's saved override if they've ever
 *  toggled it, otherwise that theme's natural default. */
export function getMode(theme?: Theme): Mode {
  return savedMode() ?? naturalMode(theme ?? getTheme());
}

export function setMode(mode: Mode) {
  window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  applyMode(mode);
}

export function applyMode(mode: Mode) {
  document.documentElement.dataset.mode = mode;
}