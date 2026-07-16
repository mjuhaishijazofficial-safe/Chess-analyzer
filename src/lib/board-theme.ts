export interface BoardTheme {
  name: string;
  light: string;
  dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { name: "slate", light: "#7d8694", dark: "#454b55" },
  { name: "green", light: "#eeeed2", dark: "#769656" },
  { name: "brown", light: "#f0d9b5", dark: "#b58863" },
  { name: "blue", light: "#dee3e6", dark: "#788a94" },
  { name: "coral", light: "#f7dcd0", dark: "#e08a6b" },
  { name: "purple", light: "#e3dcf0", dark: "#8877b8" },
  { name: "ice", light: "#e8f4f8", dark: "#7fb3c9" },
  { name: "midnight", light: "#3b3f4a", dark: "#1e2129" },
];

export type BoardThemeName = (typeof BOARD_THEMES)[number]["name"];

const STORAGE_KEY = "chessdeeper-board-theme";
const DEFAULT_THEME = BOARD_THEMES[0];

export function getBoardTheme(): BoardTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return BOARD_THEMES.find((t) => t.name === saved) ?? DEFAULT_THEME;
}

export function setBoardTheme(name: BoardThemeName) {
  window.localStorage.setItem(STORAGE_KEY, name);
}
