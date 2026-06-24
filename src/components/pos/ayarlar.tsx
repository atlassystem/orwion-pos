"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import QRCode from "qrcode";
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
  X,
  ExternalLink,
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
  const [qrOpen, setQrOpen] = useState(false);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Ayarlar & Modüller" icon={Settings} sub="Sistem yapılandırması ve eklentiler" />

      {qrOpen && <QrModal onClose={() => setQrOpen(false)} />}

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
              const isQr = m.key === "qr";
              return (
                <div
                  key={m.key}
                  onClick={() => isQr && setQrOpen(true)}
                  className="pos-card lift cursor-pointer p-5"
                >
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

/* ============================================================
   QR Menü modalı — /self adresine giden tek QR (göster + yazdır).
   ============================================================ */
function QrModal({ onClose }: { onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState("");
  const [url] = useState(() =>
    typeof window !== "undefined" ? window.location.origin + "/self" : "/self",
  );

  useEffect(() => {
    QRCode.toDataURL(url, { width: 320, margin: 2 })
      .then(setDataUrl)
      .catch(() => {});
  }, [url]);

  const print = () => {
    const w = window.open("", "_blank", "width=480,height=680");
    if (!w) return;
    w.document.write(
      `<html><head><title>Orwion QR Menü</title></head>` +
        `<body style="font-family:system-ui,sans-serif;text-align:center;padding:32px;color:#18191f">` +
        `<h2 style="margin:0 0 4px">Orwion POS — QR Menü</h2>` +
        `<p style="margin:0 0 16px;color:#666">Karekodu okutun, masanıza sipariş verin</p>` +
        `<img src="${dataUrl}" style="width:320px;height:320px"/>` +
        `<p style="color:#888;font-size:12px;margin-top:12px">${url}</p>` +
        `</body></html>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="pop flex w-full max-w-sm flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
            <QrCode className="h-5 w-5 text-brand" strokeWidth={2.2} />
            QR Menü & Self-Sipariş
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink3 transition hover:bg-surface2 hover:text-ink"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 py-6">
          <p className="mb-4 text-center text-[13px] text-ink2">
            Tek karekod — misafir şube + masa seçip sipariş verir. Ödeme yok; personel POS&apos;tan kapatır.
          </p>
          <div className="grid h-[280px] w-[280px] place-items-center rounded-2xl border border-line2 bg-white p-2">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt="QR Menü" className="h-full w-full" />
            ) : (
              <span className="text-sm text-ink3">QR üretiliyor…</span>
            )}
          </div>
          <a
            href="/self"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.4} />
            {url || "/self"}
          </a>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-line2 bg-white px-4 py-2.5 text-sm font-bold text-ink2 transition hover:bg-surface2 hover:text-ink"
          >
            Kapat
          </button>
          <button
            onClick={print}
            disabled={!dataUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 disabled:opacity-40"
          >
            <Printer className="h-4 w-4" strokeWidth={2.2} />
            Yazdır
          </button>
        </div>
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
