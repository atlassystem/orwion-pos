"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------- Üst başlık (ortak) ---------- */
export function TopBar({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  const [tarih, setTarih] = useState("");
  useEffect(() => {
    setTarih(
      new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        weekday: "long",
      }),
    );
  }, []);
  return (
    <div className="flex items-center justify-between px-7 pt-6 pb-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="text-espresso/45 mt-0.5 text-sm">{sub || tarih}</p>
      </div>
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
}

/* ---------- Pill ---------- */
export function Pill({
  children,
  tone = "b",
}: {
  children: ReactNode;
  tone?: "b" | "g" | "a";
}) {
  const map = {
    b: "bg-white text-espresso/70 border-[#E6E0D6]",
    g: "bg-emerald-50 text-emerald-700 border-emerald-200",
    a: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ---------- İstatistik kartı ---------- */
export function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "amber" | "green" | "orange" | "slate";
}) {
  const tones = {
    amber: "from-amber-400/20 to-amber-500/5 text-amber-600",
    green: "from-emerald-400/20 to-emerald-500/5 text-emerald-600",
    orange: "from-orange-400/20 to-orange-500/5 text-orange-600",
    slate: "from-slate-400/20 to-slate-500/5 text-slate-500",
  };
  return (
    <div className="soft flex items-center gap-4 rounded-2xl bg-white px-5 py-4">
      <div
        className={cn(
          "grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-xl",
          tones[tone],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-espresso/40 text-[11px] font-bold tracking-wide uppercase">
          {label}
        </div>
        <div className="font-display tnum truncate text-xl font-extrabold">
          {value}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sekme düğmesi ---------- */
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
        "rounded-xl border px-4 py-2 text-sm font-semibold transition",
        on
          ? "bg-espresso border-espresso text-white"
          : "text-espresso/65 border-[#E6E0D6] hover:border-espresso/30 bg-white",
      )}
    >
      {children}
    </button>
  );
}

/* ---------- Fiş satırı ---------- */
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
      <span className={muted ? "text-espresso/45" : "text-espresso/60"}>
        {k}
      </span>
      <span className={cn("tnum", muted ? "text-espresso/45" : "font-semibold")}>
        {v}
      </span>
    </div>
  );
}
