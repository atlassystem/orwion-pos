"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerms } from "./perms";

type Icon = ComponentType<LucideProps>;

/* ============================================================
   TopBar — koyu kanvas üstü sayfa başlığı
   ============================================================ */
export function TopBar({
  title,
  sub,
  icon: IconCmp,
  right,
}: {
  title: string;
  sub?: string;
  icon?: Icon;
  right?: ReactNode;
}) {
  const [tarih, setTarih] = useState("");
  useEffect(() => {
    // SSR/hydration uyumu için tarih yalnızca istemcide hesaplanır.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarih(
      new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        weekday: "long",
      }),
    );
  }, []);
  return (
    <div className="flex items-center justify-between px-7 pt-6 pb-5">
      <div className="flex items-center gap-3.5">
        {IconCmp && (
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft">
            <IconCmp className="h-5 w-5 text-brand" strokeWidth={2.2} />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-ink3">{sub || tarih}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">{right}</div>
    </div>
  );
}

/* ============================================================
   Pill — koyu zemin üstü durum rozeti
   ============================================================ */
export function Pill({
  children,
  tone = "slate",
  dot,
}: {
  children: ReactNode;
  tone?: "slate" | "ok" | "warn" | "info" | "grape" | "rose";
  dot?: boolean;
}) {
  const map: Record<string, string> = {
    slate: "bg-surface2 text-ink2 ring-line2",
    ok: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    warn: "bg-amber-50 text-amber-600 ring-amber-200",
    info: "bg-sky-50 text-sky-600 ring-sky-200",
    grape: "bg-violet-50 text-violet-600 ring-violet-200",
    rose: "bg-rose-50 text-rose-600 ring-rose-200",
  };
  const dotc: Record<string, string> = {
    slate: "bg-slate-400",
    ok: "bg-emerald-400",
    warn: "bg-amber-400",
    info: "bg-sky-400",
    grape: "bg-violet-400",
    rose: "bg-rose-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
        map[tone],
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotc[tone])} />}
      {children}
    </span>
  );
}

/* ============================================================
   Stat — beyaz istatistik kartı (Lucide ikonlu)
   ============================================================ */
const TONES = {
  orange: { tile: "bg-brand-soft text-brand", bar: "from-brand to-brand2" },
  amber: { tile: "bg-amber-50 text-amber-600", bar: "from-amber-400 to-amber-500" },
  green: { tile: "bg-emerald-50 text-emerald-600", bar: "from-emerald-400 to-emerald-500" },
  sky: { tile: "bg-sky-50 text-sky-600", bar: "from-sky-400 to-sky-500" },
  violet: { tile: "bg-violet-50 text-violet-600", bar: "from-violet-400 to-violet-500" },
  rose: { tile: "bg-rose-50 text-rose-600", bar: "from-rose-400 to-rose-500" },
  slate: { tile: "bg-slate-100 text-slate-500", bar: "from-slate-300 to-slate-400" },
} as const;

export function Stat({
  icon: IconCmp,
  label,
  value,
  hint,
  tone,
}: {
  icon: Icon;
  label: string;
  value: string;
  hint?: string;
  tone: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div className="pos-card relative overflow-hidden p-4">
      <div className="flex items-center gap-3.5">
        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", t.tile)}>
          <IconCmp className="h-5.5 w-5.5" strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold tracking-wide text-ink3 uppercase">
            {label}
          </div>
          <div className="font-display tnum truncate text-2xl font-extrabold text-ink">
            {value}
          </div>
          {hint && <div className="text-[11px] font-semibold text-ink2">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Tab — segment düğmesi (koyu zemin üstü)
   ============================================================ */
export function Tab({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition",
        on
          ? "bg-brand text-white ring-brand/0 shadow-sm shadow-brand/30"
          : "bg-white text-ink2 ring-line2 hover:bg-surface2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/* ============================================================
   PrimaryButton / GhostButton — koyu zemin aksiyonları
   ============================================================ */
export function PrimaryButton({
  icon: IconCmp,
  children,
  onClick,
  disabled,
  className,
}: {
  icon?: Icon;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  // Yönetici (salt-okunur) için tüm birincil aksiyonlar kilitlenir.
  const { canEdit } = usePerms();
  const locked = !canEdit;
  return (
    <button
      onClick={onClick}
      disabled={disabled || locked}
      title={locked ? "Yönetici yetkisinde düzenleme kapalıdır" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        className,
      )}
    >
      {locked ? <Lock className="h-4 w-4" strokeWidth={2.4} /> : IconCmp && <IconCmp className="h-4 w-4" strokeWidth={2.4} />}
      {children}
    </button>
  );
}

export function GhostButton({
  icon: IconCmp,
  children,
  onClick,
  disabled,
  className,
}: {
  icon?: Icon;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink2 ring-1 ring-line2 transition hover:bg-surface2 hover:text-ink active:scale-[0.98] disabled:opacity-40",
        className,
      )}
    >
      {IconCmp && <IconCmp className="h-4 w-4" strokeWidth={2.2} />}
      {children}
    </button>
  );
}

/* ============================================================
   Row — fiş / liste satırı (beyaz kart içi)
   ============================================================ */
export function Row({
  k,
  v,
  muted,
}: {
  k: string;
  v: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-ink3" : "text-ink2"}>{k}</span>
      <span className={cn("tnum", muted ? "text-ink3" : "font-semibold text-ink")}>
        {v}
      </span>
    </div>
  );
}

/* ============================================================
   Card — beyaz panel + opsiyonel başlık
   ============================================================ */
export function Card({
  title,
  icon: IconCmp,
  right,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  icon?: Icon;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("pos-card flex flex-col", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="flex items-center gap-2 font-display font-extrabold text-ink">
            {IconCmp && <IconCmp className="h-4 w-4 text-ink3" strokeWidth={2.2} />}
            {title}
          </h3>
          {right}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
