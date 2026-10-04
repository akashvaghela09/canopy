// The learner's shell: xterm.js connected to the PTY in the Rust backend.

import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal as XTerm, type ITheme } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import { api } from "../api";
import { useThemeVersion } from "../theme";

/** Resolve a CSS color (e.g. an oklch() token) to #rrggbb, which xterm needs. */
export function cssColor(variable: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx || !raw) return "#000000";
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = raw;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function xtermTheme(): ITheme {
  const ansi = (n: number) => cssColor(`--color-ansi-${n}`);
  return {
    background: cssColor("--color-term-bg"),
    foreground: cssColor("--color-term-fg"),
    cursor: cssColor("--color-term-cursor"),
    cursorAccent: cssColor("--color-term-bg"),
    selectionBackground: cssColor("--color-term-selection"),
    black: ansi(0),
    red: ansi(1),
    green: ansi(2),
    yellow: ansi(3),
    blue: ansi(4),
    magenta: ansi(5),
    cyan: ansi(6),
    white: ansi(7),
    brightBlack: ansi(8),
    brightRed: ansi(9),
    brightGreen: ansi(10),
    brightYellow: ansi(11),
    brightBlue: ansi(12),
    brightMagenta: ansi(13),
    brightCyan: ansi(14),
    brightWhite: ansi(15),
  };
}

/** Chords the app handles even while the terminal has focus (DESIGN.md 10.1). */
export function isAppChord(e: KeyboardEvent): boolean {
  if (e.key === "F6") return true;
  if (e.altKey && !e.ctrlKey && /^[1-4]$/.test(e.key)) return true;
  if (e.altKey && ["ArrowLeft", "ArrowRight", "Home", "[", "]"].includes(e.key)) return true;
  if (e.altKey && !e.ctrlKey && ["h", "g", "H", "G"].includes(e.key)) return true;
  if (e.altKey && e.shiftKey && (e.key === "R" || e.key === "r")) return true;
  if (e.ctrlKey && !e.altKey && [",", "/", "=", "-", "0"].includes(e.key)) return true;
  return false;
}

export function Terminal({
  lessonId,
  reset,
  generation,
  fontSize,
  onStarted,
  onError,
  registerFocus,
}: {
  lessonId: string;
  reset: boolean;
  generation: number;
  fontSize: number;
  onStarted: () => void;
  onError: (message: string) => void;
  registerFocus: (focus: () => void, clear: () => void) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const term = useRef<XTerm | null>(null);
  const themeVersion = useThemeVersion();

  useEffect(() => {
    const el = host.current!;
    const t = new XTerm({
      fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
      fontSize,
      lineHeight: 1.45,
      fontWeight: 400,
      fontWeightBold: 600,
      cursorStyle: "bar",
      cursorWidth: 2,
      cursorBlink: true,
      allowProposedApi: false,
      scrollback: 5000,
      theme: xtermTheme(),
      macOptionIsMeta: true,
    });
    const fit = new FitAddon();
    t.loadAddon(fit);
    t.loadAddon(new WebLinksAddon());
    t.open(el);
    // xterm measures the font when it opens; if the bundled font loads later,
    // re-apply it so the grid matches (DESIGN.md QA item 4).
    document.fonts.load(`${fontSize}px "JetBrains Mono Variable"`).then(() => {
      if (!term.current) return;
      t.options.fontFamily = t.options.fontFamily + "";
      fit.fit();
    });
    term.current = t;
    registerFocus(
      () => t.focus(),
      () => t.clear(),
    );

    t.attachCustomKeyEventHandler((e) => {
      if (e.type !== "keydown") return true;
      if (isAppChord(e)) return false;
      if (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c")) {
        const sel = t.getSelection();
        if (sel) navigator.clipboard.writeText(sel);
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === "V" || e.key === "v")) {
        navigator.clipboard.readText().then((text) => api.terminalWrite(text));
        return false;
      }
      return true;
    });

    let disposed = false;
    const onData = t.onData((d) => {
      api.terminalWrite(d).catch(() => {});
    });
    fit.fit();
    api
      .startLesson(lessonId, reset, t.cols, t.rows, (data) => {
        if (!disposed) t.write(data);
      })
      .then((info) => {
        if (disposed) return;
        if (reset) t.writeln("\x1b[2;3m— lesson reset —\x1b[0m");
        // Coming back to a lesson: say so, where the learner is looking.
        else if (!info.fresh) t.writeln("\x1b[2;3m— continuing where you left off; Reset lesson starts over —\x1b[0m");
        onStarted();
      })
      .catch((e) => onError(String(e)));

    let last = { cols: t.cols, rows: t.rows };
    // Refit at most once per frame; tell the shell only when the grid changed.
    let frame = 0;
    const ro = new ResizeObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (disposed || el.clientWidth === 0 || el.clientHeight === 0) return;
        fit.fit();
        if (t.cols !== last.cols || t.rows !== last.rows) {
          last = { cols: t.cols, rows: t.rows };
          api.terminalResize(t.cols, t.rows).catch(() => {});
        }
      });
    });
    ro.observe(el);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      onData.dispose();
      t.dispose();
      term.current = null;
    };
    // The terminal is rebuilt only for a new lesson attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, generation]);

  useEffect(() => {
    if (term.current) term.current.options.theme = xtermTheme();
  }, [themeVersion]);

  useEffect(() => {
    if (term.current) term.current.options.fontSize = fontSize;
  }, [fontSize]);

  return <div ref={host} className="h-full w-full bg-term-bg px-3 py-2" />;
}
