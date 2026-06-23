"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Wallet,
  Receipt,
  TrendingUp,
  Coins,
  Percent,
  Store,
  CalendarDays,
} from "lucide-react";
import { TL } from "@/lib/pos-data";
import { fetchReportSummary, type ReportSummary } from "@/lib/pos-api";
import { Stat, TopBar } from "./ui";

/**
 * Raporlar — Günlük Ciro / Maliyet / Kâr özeti (GERÇEK satışlardan).
 * Kapsam: aktif şube (FAZ3) + seçili gün. Tüm rakamlar order'lardan gelir.
 */
export function Rapor({
  branchId,
  branchName,
}: {
  branchId: string;
  branchName: string;
}) {
  const [date, setDate] = useState(""); // SSR-güvenli: ilk değer istemcide atanır
  const [data, setData] = useState<ReportSummary | null>(null);

  // Varsayılan gün = bugün (yerel). Yalnızca istemcide hesaplanır (hydration uyumu).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(new Date().toLocaleDateString("en-CA"));
  }, []);

  // Gün veya şube değişince gerçek özeti çek.
  useEffect(() => {
    if (!date) return;
    let alive = true;
    fetchReportSummary(date, branchId)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setData({ revenue: 0, cost: 0, profit: 0, margin: 0, orderCount: 0 });
      });
    return () => {
      alive = false;
    };
  }, [date, branchId]);

  const d = data ?? { revenue: 0, cost: 0, profit: 0, margin: 0, orderCount: 0 };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Raporlar — Günlük Özet"
        icon={BarChart3}
        right={
          <label className="flex items-center gap-2 rounded-xl border border-line2 bg-white px-3 py-2 text-sm font-bold text-ink2">
            <CalendarDays className="h-4 w-4 text-ink3" strokeWidth={2.2} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-ink outline-none"
            />
          </label>
        }
      />

      <div className="scroll-light space-y-4 overflow-y-auto px-7 pb-7">
        {/* Kapsam bilgisi */}
        <div className="flex items-center gap-2 text-sm text-ink2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[12px] font-bold text-brand">
            <Store className="h-3.5 w-3.5" strokeWidth={2.4} />
            {branchName}
          </span>
          <span className="text-ink3">·</span>
          <span className="text-[13px] font-semibold text-ink2">
            {date || "—"}
          </span>
        </div>

        {/* Özet kutuları — gerçek order'lardan */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Stat icon={Wallet} label="Toplam Ciro" value={TL(d.revenue)} tone="orange" />
          <Stat icon={Coins} label="Toplam Maliyet" value={TL(d.cost)} tone="rose" />
          <Stat icon={TrendingUp} label="Kâr" value={TL(d.profit)} tone="green" />
          <Stat icon={Percent} label="Kâr Marjı" value={"%" + d.margin} tone="sky" />
          <Stat icon={Receipt} label="Adisyon Sayısı" value={d.orderCount + ""} tone="violet" />
        </div>

        {data && d.orderCount === 0 && (
          <div className="rounded-2xl border border-dashed border-line2 bg-surface2/40 py-10 text-center text-sm text-ink3">
            Bu gün için {branchName} şubesinde kapanmış adisyon yok.
          </div>
        )}
      </div>
    </div>
  );
}
