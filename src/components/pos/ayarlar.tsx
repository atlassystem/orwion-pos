"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  Settings,
  QrCode,
  Gift,
  CalendarClock,
  Truck,
  Printer,
  Percent,
  Globe,
  Bell,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMING_MODULES } from "@/lib/pos-modules";
import { Card, TopBar } from "./ui";
import { usePerms } from "./perms";

const MOD_ICON: Record<string, ComponentType<LucideProps>> = {
  loyalty: Gift,
  reservation: CalendarClock,
  qr: QrCode,
  delivery: Truck,
};

const TOGGLES: { key: string; label: string; desc: string; ic: ComponentType<LucideProps>; on: boolean }[] = [
  { key: "kdv", label: "Fiş üzerinde KDV göster", desc: "Adisyon ve fişlerde KDV satırını ayır.", ic: Percent, on: true },
  { key: "print", label: "Mutfak yazıcısına otomatik gönder", desc: "Sipariş onayında fişi mutfağa bas.", ic: Printer, on: true },
  { key: "bildirim", label: "Hesap bekleyen masa bildirimi", desc: "15 dk üstü bekleyen masaları uyar.", ic: Bell, on: true },
  { key: "online", label: "Online ödeme (sanal POS)", desc: "QR menüden kart ile tahsilat.", ic: CreditCard, on: false },
];

export function Ayarlar() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Ayarlar & Modüller" icon={Settings} sub="Sistem yapılandırması ve eklentiler" />

      <div className="scroll-light space-y-5 overflow-y-auto px-7 pb-7">
        {/* Modüller */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-widest text-ink3 uppercase">
            <Globe className="h-3.5 w-3.5" strokeWidth={2.4} />
            Eklenti Modüller
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {COMING_MODULES.map((m) => {
              const Ic = MOD_ICON[m.key] ?? Settings;
              return (
                <div key={m.key} className="pos-card lift cursor-pointer p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                      <Ic className="h-5 w-5" strokeWidth={2.1} />
                    </div>
                    {m.soon ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        Yakında
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Hazır
                      </span>
                    )}
                  </div>
                  <div className="font-display text-sm font-extrabold text-ink">{m.title}</div>
                  <p className="mt-1 text-[12px] leading-snug text-ink2">{m.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold text-brand">
                    {m.soon ? "Bilgi al" : "Etkinleştir"}
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Genel ayarlar */}
        <Card title="Genel Ayarlar" icon={Settings} bodyClassName="p-0">
          <div className="divide-y divide-line">
            {TOGGLES.map((t) => (
              <ToggleRow key={t.key} label={t.label} desc={t.desc} ic={t.ic} on={t.on} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  ic: Ic,
  on,
}: {
  label: string;
  desc: string;
  ic: ComponentType<LucideProps>;
  on: boolean;
}) {
  const { canEdit } = usePerms();
  const [v, setV] = useState(on);
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface2 text-ink2">
        <Ic className="h-4.5 w-4.5" strokeWidth={2.1} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-ink">{label}</div>
        <div className="text-[12px] text-ink3">{desc}</div>
      </div>
      <button
        onClick={() => setV(!v)}
        disabled={!canEdit}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50",
          v ? "bg-brand" : "bg-line2",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            v ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
