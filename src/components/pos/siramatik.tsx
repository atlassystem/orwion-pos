"use client";

import { useState } from "react";
import {
  TicketCheck,
  Hash,
  Clock,
  Users,
  Phone,
  Check,
  X,
  PackageCheck,
  ChefHat,
  BellRing,
  Megaphone,
  Armchair,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUEUE,
  QSTATE,
  WAITLIST,
  WSTATE,
  type QTicket,
  type WaitEntry,
} from "@/lib/pos-modules";
import { Stat, Tab, TopBar } from "./ui";

type View = "gelal" | "bekleme";

export function Siramatik() {
  const [view, setView] = useState<View>("gelal");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Sıramatik" icon={TicketCheck} sub="Gel-al sırası ve masa bekleme yönetimi" />

      <div className="mb-4 flex items-center gap-2 px-7">
        <Tab on={view === "gelal"} onClick={() => setView("gelal")}>
          <span className="inline-flex items-center gap-1.5">
            <PackageCheck className="h-4 w-4" strokeWidth={2.1} />
            Gel-Al Sırası
          </span>
        </Tab>
        <Tab on={view === "bekleme"} onClick={() => setView("bekleme")}>
          <span className="inline-flex items-center gap-1.5">
            <Armchair className="h-4 w-4" strokeWidth={2.1} />
            Masa Bekleme
          </span>
        </Tab>
      </div>

      {view === "gelal" ? <GelAl /> : <Bekleme />}
    </div>
  );
}

/* ============================================================
   Gel-Al / Paket sırası + canlı "Hazır" ekranı
   ============================================================ */
function GelAl() {
  const [queue, setQueue] = useState<QTicket[]>(QUEUE);
  const [delivered, setDelivered] = useState(28);

  const ready = queue.filter((q) => q.state === "hazir");
  const cooking = queue.filter((q) => q.state === "hazirlaniyor");

  const markReady = (id: string) =>
    setQueue((qs) => qs.map((q) => (q.id === id ? { ...q, state: "hazir" } : q)));
  const deliver = (id: string) => {
    setQueue((qs) => qs.filter((q) => q.id !== id));
    setDelivered((c) => c + 1);
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden px-7 pb-7 lg:grid-cols-[1.4fr_1fr]">
      {/* SOL: sipariş listesi */}
      <div className="flex min-h-0 flex-col">
        <div className="mb-4 grid grid-cols-3 gap-4">
          <Stat icon={BellRing} label="Hazır" value={ready.length + ""} tone="green" />
          <Stat icon={ChefHat} label="Hazırlanıyor" value={cooking.length + ""} tone="orange" />
          <Stat icon={PackageCheck} label="Bugün Teslim" value={delivered + ""} tone="sky" />
        </div>

        <div className="scroll-light min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {queue.map((q) => {
            const st = QSTATE[q.state];
            return (
              <div key={q.id} className="pos-card flex items-center gap-4 p-3.5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink text-white">
                  <span className="font-display text-xl font-extrabold tnum">{q.no}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink">{q.name}</span>
                    <span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-bold text-ink2 ring-1 ring-line">
                      {q.channel}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-ink3">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" strokeWidth={2.4} />
                      {q.items} ürün
                    </span>
                    <span className="tnum inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" strokeWidth={2.4} />
                      {q.min} dk
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex",
                    st.chip,
                  )}
                >
                  {st.label}
                </span>
                {q.state === "hazirlaniyor" ? (
                  <button
                    onClick={() => markReady(q.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.6} />
                    Hazır
                  </button>
                ) : (
                  <button
                    onClick={() => deliver(q.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line2 bg-white px-3.5 py-2.5 text-xs font-bold text-ink2 transition hover:bg-surface2 hover:text-ink"
                  >
                    <PackageCheck className="h-4 w-4" strokeWidth={2.2} />
                    Teslim Et
                  </button>
                )}
              </div>
            );
          })}
          {queue.length === 0 && (
            <div className="pos-card grid place-items-center py-10 text-sm text-ink3">
              Sırada bekleyen sipariş yok.
            </div>
          )}
        </div>
      </div>

      {/* SAĞ: müşteri ekranı (canlı "Hazır") */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] bg-ink text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="flex items-center gap-2 font-display text-sm font-extrabold tracking-wide uppercase">
            <Megaphone className="h-4 w-4 text-emerald-400" strokeWidth={2.2} />
            Şimdi Hazır
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            canlı
          </span>
        </div>
        <div className="scroll-light flex-1 overflow-y-auto p-4">
          {ready.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-white/40">
              <div>
                <BellRing className="mx-auto mb-2 h-8 w-8 text-white/25" strokeWidth={1.6} />
                Hazır sipariş bekleniyor…
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {ready.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-center"
                >
                  <div className="font-display text-4xl font-extrabold tnum text-emerald-300">
                    {q.no}
                  </div>
                  <div className="mt-1 truncate text-[12px] font-semibold text-white/70">
                    {q.name}
                  </div>
                  <div className="text-[10px] text-white/40">{q.channel}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Hazırlananlar şeridi */}
        <div className="border-t border-white/10 px-5 py-3">
          <div className="mb-1.5 text-[10px] font-bold tracking-wide text-white/40 uppercase">
            Hazırlanıyor
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cooking.length === 0 && <span className="text-[12px] text-white/40">—</span>}
            {cooking.map((q) => (
              <span
                key={q.id}
                className="tnum rounded-lg bg-white/5 px-2.5 py-1 text-sm font-bold text-white/70"
              >
                {q.no}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Masa bekleme listesi (waitlist)
   ============================================================ */
function Bekleme() {
  const [list, setList] = useState<WaitEntry[]>(WAITLIST);
  const [seated, setSeated] = useState(9);

  const kisi = list.reduce((s, w) => s + w.size, 0);
  const ortBekleme = list.length
    ? Math.round(list.reduce((s, w) => s + w.min, 0) / list.length)
    : 0;

  const call = (id: string) =>
    setList((ls) => ls.map((w) => (w.id === id ? { ...w, state: "cagrildi" } : w)));
  const seat = (id: string) => {
    setList((ls) => ls.filter((w) => w.id !== id));
    setSeated((c) => c + 1);
  };
  const cancel = (id: string) => setList((ls) => ls.filter((w) => w.id !== id));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 grid grid-cols-3 gap-4 px-7">
        <Stat icon={Users} label="Bekleyen Kişi" value={kisi + ""} tone="orange" />
        <Stat icon={Armchair} label="Bekleyen Grup" value={list.length + ""} tone="sky" />
        <Stat icon={Clock} label="Ort. Bekleme" value={ortBekleme + " dk"} tone="violet" />
      </div>

      <div className="scroll-light grid grid-cols-1 gap-4 overflow-y-auto px-7 pb-7 lg:grid-cols-2 xl:grid-cols-3">
        {list.map((w) => {
          const st = WSTATE[w.state];
          return (
            <div key={w.id} className="pos-card p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <span className="font-display text-lg font-extrabold tnum">{w.no}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{w.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink3">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" strokeWidth={2.2} />
                      {w.size} kişi
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" strokeWidth={2.2} />
                      {w.phone}
                    </span>
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", st.chip)}>
                  {st.label}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-ink2">
                  <Clock className="h-3.5 w-3.5 text-ink3" strokeWidth={2.2} />
                  {w.min} dk bekliyor
                </span>
                <span className="font-semibold text-ink2">Tercih: {w.pref}</span>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
                <button
                  onClick={() => call(w.id)}
                  disabled={w.state === "cagrildi"}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line2 bg-white py-2.5 text-xs font-bold text-ink2 transition hover:bg-surface2 hover:text-ink disabled:opacity-40"
                >
                  <BellRing className="h-4 w-4" strokeWidth={2.2} />
                  Çağır
                </button>
                <button
                  onClick={() => seat(w.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-xs font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2"
                >
                  <Check className="h-4 w-4" strokeWidth={2.6} />
                  Masaya Al
                </button>
                <button
                  onClick={() => cancel(w.id)}
                  aria-label="İptal"
                  className="grid w-10 place-items-center rounded-xl border border-line2 bg-white text-ink3 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <X className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="pos-card col-span-full grid place-items-center py-10 text-sm text-ink3">
            Bekleme listesi boş. Bugün {seated} grup masaya alındı.
          </div>
        )}
      </div>
    </div>
  );
}
