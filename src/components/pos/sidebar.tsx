"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  LayoutGrid,
  ChefHat,
  BookOpen,
  Boxes,
  Users,
  BarChart3,
  Building2,
  Settings,
  UtensilsCrossed,
  ChevronsUpDown,
  HelpCircle,
  MoreVertical,
  ConciergeBell,
  TicketCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export type View =
  | "masalar"
  | "garson"
  | "mutfak"
  | "siramatik"
  | "menu"
  | "stok"
  | "personel"
  | "rapor"
  | "subeler"
  | "ayarlar";

type Icon = ComponentType<LucideProps>;

const GROUPS: {
  label: string;
  items: { id: View; label: string; ic: Icon; badge?: string }[];
}[] = [
  {
    label: "Menü",
    items: [
      { id: "masalar", label: "Masa Planı", ic: LayoutGrid },
      { id: "garson", label: "Garson Terminali", ic: ConciergeBell },
      { id: "mutfak", label: "Mutfak (KDS)", ic: ChefHat },
      { id: "siramatik", label: "Sıramatik", ic: TicketCheck },
      { id: "menu", label: "Menü Yönetimi", ic: BookOpen },
      { id: "stok", label: "Stok & Envanter", ic: Boxes, badge: "3" },
      { id: "personel", label: "Personel", ic: Users },
      { id: "rapor", label: "Raporlar", ic: BarChart3 },
    ],
  },
  {
    label: "Diğer",
    items: [
      { id: "subeler", label: "Şubeler", ic: Building2 },
      { id: "ayarlar", label: "Ayarlar", ic: Settings },
    ],
  },
];

export function Sidebar({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  return (
    <aside className="flex w-[256px] shrink-0 flex-col border-r border-line bg-panel">
      {/* Marka */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand shadow-sm">
          <UtensilsCrossed className="h-5 w-5 text-white" strokeWidth={2.4} />
        </div>
        <div className="text-[17px] font-extrabold tracking-tight text-ink">
          {BRAND.name}
          <span className="ml-1 text-brand">{BRAND.suffix}</span>
        </div>
      </div>

      {/* Şube seçici */}
      <div className="px-3 pb-1">
        <div className="px-2 pt-1 pb-1.5 text-[11px] font-bold tracking-wide text-ink3 uppercase">
          Şube
        </div>
        <button className="flex w-full items-center gap-2.5 rounded-xl border border-line2 bg-surface2 px-2.5 py-2 text-left transition hover:bg-white">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-[11px] font-bold text-brand">
            MŞ
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
            Merkez Şube
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink3" strokeWidth={2} />
        </button>
      </div>

      {/* Navigasyon */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-3">
            <div className="px-2 pt-2 pb-1.5 text-[11px] font-bold tracking-wide text-ink3 uppercase">
              {g.label}
            </div>
            <div className="flex flex-col gap-1">
              {g.items.map((it) => {
                const on = view === it.id;
                const Ic = it.ic;
                return (
                  <button
                    key={it.id}
                    onClick={() => setView(it.id)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      on
                        ? "bg-brand text-white shadow-sm shadow-brand/30"
                        : "text-ink2 hover:bg-surface2 hover:text-ink",
                    )}
                  >
                    <Ic
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition",
                        on ? "text-white" : "text-ink3 group-hover:text-ink2",
                      )}
                      strokeWidth={2.2}
                    />
                    <span className="flex-1 text-left">{it.label}</span>
                    {it.badge && (
                      <span
                        className={cn(
                          "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold",
                          on ? "bg-white/25 text-white" : "bg-brand-soft text-brand",
                        )}
                      >
                        {it.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Yardım */}
        <button className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2 hover:text-ink">
          <HelpCircle className="h-[18px] w-[18px] text-ink3 group-hover:text-ink2" strokeWidth={2.2} />
          Yardım & Destek
        </button>
      </nav>

      {/* Kullanıcı */}
      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-surface2">
          <div className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-brand text-xs font-bold text-white">
            AY
            <span className="absolute -right-0 -bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-bold text-ink">Ahmet Yılmaz</div>
            <div className="truncate text-[11px] text-ink3">Yönetici</div>
          </div>
          <MoreVertical className="h-4 w-4 shrink-0 text-ink3" strokeWidth={2} />
        </div>
      </div>
    </aside>
  );
}
