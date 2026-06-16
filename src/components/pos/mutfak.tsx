"use client";

import { cn } from "@/lib/utils";
import {
  HALLS,
  minutesSince,
  prodById,
  type OrderItem,
  type Table,
} from "@/lib/pos-data";

interface Ticket {
  no: string;
  hall: string;
  startedAt: number | null;
  waiter: string | null;
  items: OrderItem[];
}

type ColKey = "yeni" | "hazirlaniyor" | "hazir";

const COLS: { k: ColKey; label: string; bar: string }[] = [
  { k: "yeni", label: "🆕 Yeni Sipariş", bar: "bg-rose-500" },
  { k: "hazirlaniyor", label: "🍳 Hazırlanıyor", bar: "bg-amber-500" },
  { k: "hazir", label: "✅ Hazır", bar: "bg-emerald-500" },
];

export function Mutfak({
  tables,
  clockMin,
}: {
  tables: Table[];
  clockMin: number;
}) {
  const tickets: Ticket[] = [];
  tables
    .filter((t) => t.status === "dolu" || t.status === "hesap")
    .forEach((t) => {
      const mut = t.items.filter((it) => prodById[it.pid]?.route === "mutfak");
      if (mut.length)
        tickets.push({
          no: t.no,
          hall: t.hall,
          startedAt: t.startedAt,
          waiter: t.waiter,
          items: mut,
        });
    });
  tickets.sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0));

  const colOf = (tk: Ticket): ColKey => {
    const m = minutesSince(tk.startedAt, clockMin);
    if (m > 40) return "hazir";
    if (m > 15) return "hazirlaniyor";
    return "yeni";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#15110E] text-white">
      <div className="flex items-center justify-between px-7 pt-6 pb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            Mutfak Ekranı{" "}
            <span className="text-base font-semibold text-white/30">KDS</span>
          </h1>
          <p className="text-sm text-white/40">
            {tickets.length} aktif sipariş · canlı
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
          🔴 15 dk üstü uyarı
        </span>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden px-7 pb-7">
        {COLS.map((col) => {
          const cards = tickets.filter((tk) => colOf(tk) === col.k);
          return (
            <div
              key={col.k}
              className="flex min-h-0 flex-col rounded-2xl border border-white/5 bg-white/[0.04]"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-bold">{col.label}</span>
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-xs font-bold">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto px-3 pb-3">
                {cards.map((tk) => {
                  const m = minutesSince(tk.startedAt, clockMin);
                  const gec = m > 15;
                  return (
                    <div
                      key={tk.no}
                      className="overflow-hidden rounded-xl border border-white/5 bg-[#211A15]"
                    >
                      <div className={cn("h-1", col.bar)} />
                      <div className="px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-lg font-extrabold">
                            Masa {tk.no}
                          </span>
                          <span
                            className={cn(
                              "tnum rounded-full px-2 py-0.5 text-xs font-bold",
                              gec
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-white/10 text-white/60",
                            )}
                          >
                            ⏱ {m} dk
                          </span>
                        </div>
                        <div className="mb-2 text-[11px] text-white/35">
                          {HALLS.find((h) => h.id === tk.hall)?.name} · {tk.waiter}
                        </div>
                        <div className="space-y-1">
                          {tk.items.map((it) => (
                            <div
                              key={it.pid}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="bg-amber0 text-espresso grid h-5 w-5 place-items-center rounded text-xs font-extrabold">
                                {it.qty}
                              </span>
                              <span className="text-white/85">
                                {prodById[it.pid]?.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <div className="py-8 text-center text-sm text-white/20">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
