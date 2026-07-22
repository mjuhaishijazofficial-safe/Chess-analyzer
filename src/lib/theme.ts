export const THEMES = ["terminal", "club"] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "chessdeeper-theme";
const DEFAULT_THEME: Theme = "terminal";

export function getTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return (THEMES as readonly string[]).includes(saved ?? "") ? (saved as Theme) : DEFAULT_THEME;
}

/** Persists the choice and applies it immediately via the `data-theme` attribute that globals.css keys off of. */
export function setTheme(theme: Theme) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  if (theme === "terminal") {
    document.documentElement.removeAttribute("data-theme"); // terminal is the unstyled default
  } else {
    document.documentElement.dataset.theme = theme;
  }
}
