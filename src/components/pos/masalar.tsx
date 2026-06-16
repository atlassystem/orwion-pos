"use client";

import { cn } from "@/lib/utils";
import {
  HALLS,
  STATUS,
  TL,
  elapsed,
  itemCount,
  orderTotal,
  type Table,
} from "@/lib/pos-data";
import { Pill, Stat, TopBar } from "./ui";

export function Masalar({
  tables,
  activeHall,
  setActiveHall,
  onOpen,
  clockMin,
}: {
  tables: Table[];
  activeHall: string;
  setActiveHall: (h: string) => void;
  onOpen: (no: string) => void;
  clockMin: number;
}) {
  const all = tables;
  const hallTables = tables.filter((t) => t.hall === activeHall);
  const dolu = all.filter((t) => t.status === "dolu").length;
  const hesap = all.filter((t) => t.status === "hesap").length;
  const bos = all.filter((t) => t.status === "bos").length;
  const acikCiro = all.reduce((s, t) => s + orderTotal(t.items), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Masa Planı"
        right={
          <>
            <Pill tone="g">{dolu} Dolu</Pill>
            <Pill tone="a">{hesap} Hesap</Pill>
            <Pill>{bos} Boş</Pill>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-4 px-7">
        <Stat icon="💵" label="Açık Hesap Tutarı" value={TL(acikCiro)} tone="amber" />
        <Stat icon="🍽️" label="Dolu Masa" value={dolu + " / " + all.length} tone="green" />
        <Stat icon="⏱️" label="Hesap Bekleyen" value={hesap + " masa"} tone="orange" />
        <Stat icon="🪑" label="Boş Masa" value={bos + " masa"} tone="slate" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        {HALLS.map((h) => {
          const on = activeHall === h.id;
          const c = tables.filter((t) => t.hall === h.id).length;
          return (
            <button
              key={h.id}
              onClick={() => setActiveHall(h.id)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                on
                  ? "bg-espresso border-espresso soft text-white"
                  : "text-espresso/65 border-[#E6E0D6] hover:border-espresso/30 bg-white",
              )}
            >
              {h.name}{" "}
              <span className={on ? "text-white/55" : "text-espresso/35"}>{c}</span>
            </button>
          );
        })}
        <div className="text-espresso/45 ml-auto flex items-center gap-3 text-xs">
          {Object.entries(STATUS).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: v.dot }}
              />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {hallTables.map((t) => (
            <TableCard key={t.no} t={t} onOpen={onOpen} clockMin={clockMin} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TableCard({
  t,
  onOpen,
  clockMin,
}: {
  t: Table;
  onOpen: (no: string) => void;
  clockMin: number;
}) {
  const s = STATUS[t.status];
  const total = orderTotal(t.items);
  const count = itemCount(t.items);
  return (
    <button
      onClick={() => onOpen(t.no)}
      className={cn(
        "soft lift overflow-hidden rounded-2xl border bg-white text-left",
        s.ring,
      )}
    >
      <div className={cn("px-4 pt-4 pb-3", s.soft)}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-espresso/35 text-[11px] font-bold tracking-wide uppercase">
              Masa
            </div>
            <div className="font-display text-3xl leading-none font-extrabold">
              {t.no}
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-black/5 bg-white/80 px-2 py-1 text-[11px] font-bold">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.dot }}
            />
            {s.label}
          </span>
        </div>
      </div>
      <div className="border-t border-[#F0EBE2] px-4 py-3">
        <div className="text-espresso/55 flex items-center justify-between text-xs">
          <span>👤 {t.seats} kişilik</span>
          {t.startedAt != null && (
            <span className="tnum">⏱ {elapsed(t.startedAt, clockMin)}</span>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-espresso/40 text-[11px] font-semibold">
              {count ? count + " ürün" : "—"}
            </div>
            <div className="font-display tnum text-lg font-extrabold">
              {total ? TL(total) : "Boş"}
            </div>
          </div>
          {t.waiter && (
            <span className="text-espresso/45 rounded-lg bg-[#F4F1EC] px-2 py-1 text-[11px] font-semibold">
              {t.waiter}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
