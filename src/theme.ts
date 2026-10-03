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

/** One size for everything: the interface (rem) and the terminal font. */
export const TEXT_SIZES = [
  { value: 90, label: "Small" },
  { value: 100, label: "Default" },
  { value: 112, label: "Large" },
  { value: 125, label: "Larger" },
  { value: 140, label: "Largest" },
];

export function textScale(settings: Record<string, string>): number {
  const v = Number(settings.textSize ?? 100);
  return TEXT_SIZES.some((t) => t.value === v) ? v : 100;
}
