// Theme and motion preferences: applied as attributes on <html>, so the CSS
// variables in styles.css switch without re-rendering components.

import { useEffect, useState } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

function bump() {
  version += 1;
  listeners.forEach((l) => l());
}

const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
media?.addEventListener("change", bump);

/** "system" | "light" | "dark" */
export function applyTheme(theme: string | undefined) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
  bump();
}

/** "system" | "reduce" */
export function applyMotion(motion: string | undefined) {
  const root = document.documentElement;
  if (motion === "reduce") root.setAttribute("data-motion", "reduce");
  else root.removeAttribute("data-motion");
}

export function isDark(): boolean {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "dark" || (t !== "light" && Boolean(media?.matches));
}

/** Changes whenever the effective theme may have changed (for canvas/xterm colors). */
export function useThemeVersion(): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    const l = () => setV(version);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}

/** Lesson text sizes (px): scales only the lesson panel's content. */
export const LESSON_STEPS = [13, 14, 15, 16, 17, 18, 20, 22];
/** Terminal and editor sizes (px). */
export const CODE_STEPS = [11, 12, 13, 14, 15, 16, 18, 20];
export const LESSON_DEFAULT = 15;
export const CODE_DEFAULT = 13;

const pick = (steps: number[], v: number, dflt: number) => (steps.includes(v) ? v : dflt);
export const lessonFs = (settings: Record<string, string>) => pick(LESSON_STEPS, Number(settings.lessonText ?? LESSON_DEFAULT), LESSON_DEFAULT);
export const codeFs = (settings: Record<string, string>) => pick(CODE_STEPS, Number(settings.codeText ?? CODE_DEFAULT), CODE_DEFAULT);

/** Nearest allowed step to a value. */
export function nearest(steps: number[], v: number): number {
  return steps.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
}

/** Next step up or down from the current value. */
export function stepBy(steps: number[], v: number, dir: 1 | -1): number {
  const i = steps.indexOf(nearest(steps, v));
  return steps[Math.min(steps.length - 1, Math.max(0, i + dir))];
}
