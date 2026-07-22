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
  applyMode(getMode(theme));
}

export function applyTheme(theme: Theme) {
  if (theme === "terminal") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

export type Mode = "dark" | "light";
const MODE_STORAGE_KEY = "chessdeeper-mode";

export function naturalMode(theme: Theme): Mode {
  return theme === "forest" ? "light" : "dark";
}

function savedMode(): Mode | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : null;
}

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
