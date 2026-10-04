// Terminal color themes. "canopy" uses the app's own terminal tokens (and
// follows light/dark); the others are well-known palettes applied by
// overriding those tokens, so the terminal pane, its placeholders and xterm
// all pick them up. Switching costs one xterm re-theme; nothing runs while idle.

export type TerminalTheme = {
  id: string;
  label: string;
  bg: string;
  fg: string;
  cursor: string;
  selection: string;
  /** 16 ANSI colors: black red green yellow blue magenta cyan white, then bright. */
  ansi: string[];
};

export const TERMINAL_THEMES: TerminalTheme[] = [
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    bg: "#1a1b26",
    fg: "#c0caf5",
    cursor: "#c0caf5",
    selection: "#33467c",
    ansi: ["#15161e", "#f7768e", "#9ece6a", "#e0af68", "#7aa2f7", "#bb9af7", "#7dcfff", "#a9b1d6", "#414868", "#f7768e", "#9ece6a", "#e0af68", "#7aa2f7", "#bb9af7", "#7dcfff", "#c0caf5"],
  },
  {
    id: "dracula",
    label: "Dracula",
    bg: "#282a36",
    fg: "#f8f8f2",
    cursor: "#f8f8f2",
    selection: "#44475a",
    ansi: ["#21222c", "#ff5555", "#50fa7b", "#f1fa8c", "#bd93f9", "#ff79c6", "#8be9fd", "#f8f8f2", "#6272a4", "#ff6e6e", "#69ff94", "#ffffa5", "#d6acff", "#ff92df", "#a4ffff", "#ffffff"],
  },
  {
    id: "nord",
    label: "Nord",
    bg: "#2e3440",
    fg: "#d8dee9",
    cursor: "#d8dee9",
    selection: "#434c5e",
    ansi: ["#3b4252", "#bf616a", "#a3be8c", "#ebcb8b", "#81a1c1", "#b48ead", "#88c0d0", "#e5e9f0", "#4c566a", "#bf616a", "#a3be8c", "#ebcb8b", "#81a1c1", "#b48ead", "#8fbcbb", "#eceff4"],
  },
  {
    id: "gruvbox",
    label: "Gruvbox",
    bg: "#282828",
    fg: "#ebdbb2",
    cursor: "#ebdbb2",
    selection: "#504945",
    ansi: ["#282828", "#cc241d", "#98971a", "#d79921", "#458588", "#b16286", "#689d6a", "#a89984", "#928374", "#fb4934", "#b8bb26", "#fabd2f", "#83a598", "#d3869b", "#8ec07c", "#ebdbb2"],
  },
  {
    id: "solarized-light",
    label: "Solarized Light",
    bg: "#fdf6e3",
    fg: "#586e75",
    cursor: "#586e75",
    selection: "#eee8d5",
    ansi: ["#073642", "#dc322f", "#859900", "#b58900", "#268bd2", "#d33682", "#2aa198", "#93a1a1", "#002b36", "#cb4b16", "#586e75", "#657b83", "#839496", "#6c71c4", "#93a1a1", "#fdf6e3"],
  },
  {
    id: "github-light",
    label: "GitHub Light",
    bg: "#ffffff",
    fg: "#24292f",
    cursor: "#0969da",
    selection: "#ddf4ff",
    ansi: ["#24292f", "#cf222e", "#116329", "#4d2d00", "#0969da", "#8250df", "#1b7c83", "#6e7781", "#57606a", "#a40e26", "#1a7f37", "#633c01", "#218bff", "#a475f9", "#3192aa", "#8c959f"],
  },
];

const VARS = ["--color-term-bg", "--color-term-fg", "--color-term-cursor", "--color-term-selection", ...Array.from({ length: 16 }, (_, i) => `--color-ansi-${i}`)];

/** Override the terminal tokens on <html>, or clear them for the Canopy theme. */
export function setTerminalTokens(id: string | undefined) {
  const style = document.documentElement.style;
  const t = TERMINAL_THEMES.find((x) => x.id === id);
  if (!t) {
    VARS.forEach((v) => style.removeProperty(v));
    return;
  }
  const values = [t.bg, t.fg, t.cursor, t.selection, ...t.ansi];
  VARS.forEach((v, i) => style.setProperty(v, values[i]));
}
