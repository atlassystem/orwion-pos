"use client";

import { useState } from "react";
import {
  ConciergeBell,
  Wallet,
  Utensils,
  Receipt,
  UserRound,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS,
  TL,
  elapsed,
  itemCount,
  orderTotal,
  type Table,
} from "@/lib/pos-data";
import { STAFF, SHIFT } from "@/lib/pos-modules";
import { Pill, Stat, TopBar } from "./ui";

/** Garson listesi STAFF'tan türetilir; masa.waiter ile eşleşen ad ön ad. */
const WAITERS = STAFF.filter((s) => s.role === "Garson").map((s) => ({
  key: s.name.split(" ")[0],
  name: s.name,
  initials: s.initials,
  state: s.state,
}));

export function Garson({
  tables,
  onOpen,
  clockMin,
}: {
  tables: Table[];
  onOpen: (no: string) => void;
  clockMin: number;
}) {
  const [who, setWho] = useState(WAITERS[0]?.key ?? "");
  const current = WAITERS.find((w) => w.key === who);

  const mine = tables.filter((t) => t.waiter === who && t.items.length);
  const acikCiro = mine.reduce((s, t) => s + orderTotal(t.items), 0);
  const hesap = mine.filter((t) => t.status === "hesap").length;
  const bos = tables.filter((t) => t.status === "bos");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Garson Terminali"
        icon={ConciergeBell}
        sub="Masalarını yönet, hızlı adisyon aç"
        right={
          current && (
            <Pill tone={current.state === "vardiyada" ? "ok" : "warn"} dot>
              {current.name} · {SHIFT[current.state].label}
            </Pill>
          )
        }
      />

      {/* Garson seçici */}
      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        {WAITERS.map((w) => {
          const on = who === w.key;
          const n = tables.filter((t) => t.waiter === w.key && t.items.length).length;
          return (
            <button
              key={w.key}
              onClick={() => setWho(w.key)}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border py-2 pr-4 pl-2 text-sm font-bold transition",
                on
                  ? "border-brand/0 bg-brand text-white shadow-sm shadow-brand/30"
                  : "border-line2 bg-white text-ink2 hover:bg-surface2 hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl text-xs font-extrabold",
                  on ? "bg-white/20 text-white" : "bg-brand-soft text-brand",
                )}
              >
                {w.initials}
              </span>
              {w.key}
              <span
                className={cn(
                  "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px]",
                  on ? "bg-white/25 text-white" : "bg-surface2 text-ink3",
                )}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* İstatistik */}
      <div className="mb-4 grid grid-cols-3 gap-4 px-7">
        <Stat icon={Utensils} label="Açık Masam" value={mine.length + ""} tone="green" />
        <Stat icon={Wallet} label="Açık Hesabım" value={TL(acikCiro)} tone="orange" />
        <Stat icon={Receipt} label="Hesap Bekleyen" value={hesap + " masa"} tone="sky" />
      </div>

      <div className="scroll-light space-y-6 overflow-y-auto px-7 pb-7">
        {/* Masalarım */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold tracking-wide text-ink2 uppercase">
            Masalarım
            <span className="rounded-full bg-surface2 px-2 py-0.5 text-[11px] text-ink3">
              {mine.length}
            </span>
          </h3>
          {mine.length === 0 ? (
            <div className="pos-card grid place-items-center px-6 py-10 text-center text-sm text-ink3">
              <div>
                <ConciergeBell className="mx-auto mb-2 h-8 w-8 text-ink3/60" strokeWidth={1.6} />
                Açık masan yok. Aşağıdan boş bir masa açabilirsin.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {mine.map((t) => (
                <MyTable key={t.no} t={t} clockMin={clockMin} onOpen={onOpen} />
              ))}
            </div>
          )}
        </section>

        {/* Boş masa aç */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold tracking-wide text-ink2 uppercase">
            Boş Masa Aç
            <span className="rounded-full bg-surface2 px-2 py-0.5 text-[11px] text-ink3">
              {bos.length}
            </span>
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {bos.map((t) => (
              <button
                key={t.no}
                onClick={() => onOpen(t.no)}
                className="lift flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line2 bg-white py-5 text-center transition hover:border-brand/40 hover:bg-brand-soft/40"
              >
                <span className="font-display text-xl font-extrabold text-ink">{t.no}</span>
                <span className="flex items-center gap-1 text-[11px] text-ink3">
                  <UserRound className="h-3 w-3" strokeWidth={2.2} />
                  {t.seats}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                  <Plus className="h-3 w-3" strokeWidth={3} />
                  Aç
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MyTable({
  t,
  clockMin,
  onOpen,
}: {
  t: Table;
  clockMin: number;
  onOpen: (no: string) => void;
}) {
  const s = STATUS[t.status];
  return (
    <button
      onClick={() => onOpen(t.no)}
      className={cn("pos-card lift overflow-hidden border-2 text-left", s.ring)}
    >
      <div className={cn("flex items-start justify-between px-4 pt-3.5 pb-2.5", s.soft)}>
        <div>
          <div className="text-[11px] font-bold tracking-wide text-ink3 uppercase">Masa</div>
          <div className="font-display text-2xl leading-none font-extrabold text-ink">{t.no}</div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold",
            s.chip,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
          {s.label}
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-xs text-ink2">
          <span className="inline-flex items-center gap-1">
            <Utensils className="h-3.5 w-3.5 text-ink3" strokeWidth={2.2} />
            {itemCount(t.items)} ürün
          </span>
          {t.startedAt != null && (
            <span className="tnum inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-ink3" strokeWidth={2.2} />
              {elapsed(t.startedAt, clockMin)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display tnum text-lg font-extrabold text-ink">
            {TL(orderTotal(t.items))}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
            Aç
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
        </div>
      </div>
    </button>
  );
}
