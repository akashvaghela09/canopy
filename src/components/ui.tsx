// Shared UI primitives. Specs: docs/design/DESIGN.md section 7.

import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle, type LucideIcon } from "lucide-react";
import React, { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost" | "link";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ink-fg hover:opacity-90 active:opacity-80",
  secondary: "bg-surface border border-edge-2 text-fg hover:bg-sunken active:border-fg-3",
  ghost: "text-fg-2 hover:bg-sunken hover:text-fg",
  danger: "bg-danger text-fg-inverse hover:opacity-90 active:opacity-80",
  "danger-ghost": "text-danger hover:bg-danger-soft",
  link: "text-accent hover:underline px-0! h-auto!",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  loading,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  loading?: boolean;
}) {
  const h = size === "sm" ? "h-6 px-2 text-xs" : size === "lg" ? "h-8 px-3 text-sm" : "h-7 px-3 text-sm";
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm font-medium whitespace-nowrap transition-colors duration-[var(--dur-fast)] disabled:cursor-not-allowed disabled:opacity-50 ${h} ${variants[variant]} ${className}`}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon ? <Icon size={14} strokeWidth={1.75} /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  size = 24,
  pressed,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; size?: 24 | 28; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={`inline-flex shrink-0 items-center justify-center rounded-sm transition-colors duration-[var(--dur-fast)] ${
        pressed ? "bg-accent-soft text-accent" : "text-fg-2 hover:bg-sunken hover:text-fg"
      } disabled:opacity-50 ${className}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  );
}

export function Chip({ children, tone = "kind", className = "" }: { children: ReactNode; tone?: "kind" | "warning" | "outline" | "count"; className?: string }) {
  const tones = {
    kind: "bg-sunken text-fg-2",
    warning: "border border-warning text-fg-2",
    outline: "border border-edge-2 text-fg-2",
    count: "bg-sunken text-fg-2 font-mono tabular-nums",
  };
  return (
    <span className={`inline-flex h-5 items-center rounded-sm px-1.5 text-2xs font-medium whitespace-nowrap ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ done, total, label, thick }: { done: number; total: number; label: string; thick?: boolean }) {
  const ratio = total === 0 ? 0 : done / total;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      className={`w-full overflow-hidden rounded-full bg-edge dark:bg-edge-2 ${thick ? "h-1.5" : "h-1"}`}
    >
      <div
        className={`h-full origin-left rounded-full transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] ${ratio >= 1 ? "bg-success" : "bg-accent"}`}
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  );
}

type BannerTone = "info" | "warning" | "danger" | "success";
const bannerStyles: Record<BannerTone, { box: string; icon: LucideIcon; iconClass: string }> = {
  info: { box: "bg-accent-soft border-accent/40", icon: Info, iconClass: "text-accent" },
  warning: { box: "bg-warning-soft border-warning/50", icon: AlertTriangle, iconClass: "text-warning" },
  danger: { box: "bg-danger-soft border-danger/50", icon: XCircle, iconClass: "text-danger" },
  success: { box: "bg-success-soft border-success/50", icon: CheckCircle2, iconClass: "text-success" },
};

export function Banner({
  tone,
  title,
  children,
  onDismiss,
  actions,
  className = "",
}: {
  tone: BannerTone;
  title?: ReactNode;
  children?: ReactNode;
  onDismiss?: () => void;
  actions?: ReactNode;
  className?: string;
}) {
  const s = bannerStyles[tone];
  const Icon = s.icon;
  return (
    <div className={`flex gap-2.5 rounded-md border px-3 py-2.5 text-sm text-fg ${s.box} ${className}`} role={tone === "danger" ? "alert" : undefined}>
      <Icon size={16} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${s.iconClass}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {onDismiss && <IconButton icon={X} label="Dismiss" onClick={onDismiss} className="-mt-0.5 -mr-1" />}
    </div>
  );
}

export function PaneHeader({ label, context, children, id }: { label: string; context?: ReactNode; children?: ReactNode; id?: string }) {
  return (
    <div className="flex h-[var(--size-pane-header)] shrink-0 items-center gap-2 border-b border-edge bg-surface pr-2 pl-3">
      <h2 id={id} className="text-2xs font-semibold tracking-[0.06em] text-fg-3 uppercase">
        {label}
      </h2>
      {context && <div className="min-w-0 truncate font-mono text-xs text-fg-2">{context}</div>}
      <div className="ml-auto flex items-center gap-1">{children}</div>
    </div>
  );
}

/** Keep Tab / Shift+Tab inside `ref` while it is mounted (dialogs, sheets). */
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !ref.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !ref.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [ref]);
}

export function Dialog({
  title,
  children,
  actions,
  onClose,
  width = 440,
}: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rounded-lg border border-edge-2 bg-raised p-5 text-base"
        style={{ width: `${width / 16}rem`, maxWidth: "calc(100vw - 2rem)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-2 text-fg-2">{children}</div>
        <div className="mt-5 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

export function Spinner({ size = 14 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-fg-3" aria-hidden />;
}
