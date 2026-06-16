"use client";

import { cn } from "@/lib/utils";

export type View = "masalar" | "mutfak" | "menu" | "rapor";

const ITEMS: { id: View; label: string; ic: string }[] = [
  { id: "masalar", label: "Masalar", ic: "🪑" },
  { id: "mutfak", label: "Mutfak", ic: "👨‍🍳" },
  { id: "menu", label: "Menü", ic: "📖" },
  { id: "rapor", label: "Gün Sonu", ic: "📊" },
];

export function Sidebar({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  return (
    <aside className="from-espresso to-espresso2 flex w-[88px] shrink-0 flex-col items-center gap-1 bg-gradient-to-b py-5 text-white">
      <div className="from-gold to-amber1 text-espresso font-display soft-lg grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-xl font-extrabold">
        L
      </div>
      <div className="mt-2 mb-4 text-[10px] font-semibold tracking-widest text-white/40">
        LEZZET
      </div>
      <nav className="flex w-full flex-1 flex-col gap-2 px-2">
        {ITEMS.map((it) => {
          const on = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className={cn(
                "group relative flex flex-col items-center gap-1 rounded-2xl py-3 transition",
                on
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              {on && (
                <span className="bg-gold absolute top-1/2 left-0 h-7 w-1 -translate-y-1/2 rounded-r" />
              )}
              <span className="text-xl leading-none">{it.ic}</span>
              <span className="text-[10px] font-semibold">{it.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-sm font-bold ring-2 ring-white/10">
        AY
      </div>
    </aside>
  );
}
