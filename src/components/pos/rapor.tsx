"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Wallet,
  Receipt,
  TrendingUp,
  Coins,
  Percent,
  Store,
  CalendarDays,
  Package,
  CreditCard,
  CalendarRange,
  FileDown,
} from "lucide-react";
import { TL } from "@/lib/pos-data";
import { fetchSalesReport, type SalesReport } from "@/lib/pos-api";
import { Stat, TopBar, Card, Tab, GhostButton } from "./ui";

/**
 * Raporlar — Günlük / Dönemsel satış raporu (GERÇEK satışlardan).
 * Kapsam: aktif şube (FAZ3) + seçili gün ya da tarih aralığı. Tüm rakamlar
 * kapanmış order'lardan gelir. Özet + günlük dağılım + en çok satanlar + ödeme türü.
 */

/** Yerel "bugün" (YYYY-MM-DD). Yalnızca istemcide çağrılır (hydration uyumu). */
const todayLocal = () => new Date().toLocaleDateString("en-CA");
/** d güne ekle/çıkar; YYYY-MM-DD döner. */
function shiftDay(iso: string, days: number): string {
  const dt = new Date(`${iso}T00:00:00`);
  dt.setDate(dt.getDate() + days);
  return dt.toLocaleDateString("en-CA");
}

const METHOD_LABEL: Record<string, string> = {
  nakit: "Nakit",
  kredi: "Kredi Kartı",
  kart: "Kredi Kartı",
  online: "Online",
};
const methodLabel = (m: string) => METHOD_LABEL[m] ?? m;

const EMPTY: SalesReport = {
  summary: { revenue: 0, cost: 0, profit: 0, margin: 0, orderCount: 0 },
  byDay: [],
  byProduct: [],
  byMethod: [],
};

type Mode = "gun" | "donem";

/* ============================================================
   PDF çıktısı — tarayıcının "Yazdır → PDF olarak kaydet" akışı.
   Ek kütüphane yok: raporu temiz bir HTML'e dökeriz, gizli bir
   iframe içinde yazdırma penceresini açarız. Kullanıcı hedef
   olarak "PDF olarak kaydet"i seçerek dosyayı indirir.
   ============================================================ */

/** HTML enjeksiyonuna karşı metin kaçışı (ürün adları vb.). */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Seçili raporu yazdırılabilir tam HTML belgesine dönüştürür. */
function buildReportHtml(
  d: SalesReport,
  opts: { mode: Mode; branchName: string; scope: string },
): string {
  const s = d.summary;
  const multiDay = d.byDay.length > 1;
  const baslik = opts.mode === "gun" ? "Günlük Satış Raporu" : "Dönemsel Satış Raporu";

  const ozetRows = [
    ["Toplam Ciro", TL(s.revenue)],
    ["Toplam Maliyet", TL(s.cost)],
    ["Kâr", TL(s.profit)],
    ["Kâr Marjı", "%" + s.margin],
    ["Adisyon Sayısı", String(s.orderCount)],
  ]
    .map(
      ([k, v]) =>
        `<tr><td>${esc(k)}</td><td class="num">${esc(v)}</td></tr>`,
    )
    .join("");

  const gunlukTablo =
    multiDay && s.orderCount > 0
      ? `<h2>Günlük Dağılım</h2>
         <table class="grid">
           <thead><tr><th>Tarih</th><th class="num">Ciro</th><th class="num">Maliyet</th><th class="num">Kâr</th><th class="num">Adisyon</th></tr></thead>
           <tbody>${d.byDay
             .map(
               (r) =>
                 `<tr><td>${esc(r.date)}</td><td class="num">${esc(TL(r.revenue))}</td><td class="num">${esc(TL(r.cost))}</td><td class="num">${esc(TL(r.profit))}</td><td class="num">${r.orderCount}</td></tr>`,
             )
             .join("")}</tbody>
         </table>`
      : "";

  const urunTablo =
    s.orderCount > 0
      ? `<h2>En Çok Satan Ürünler</h2>
         <table class="grid">
           <thead><tr><th>Ürün</th><th class="num">Adet</th><th class="num">Ciro</th><th class="num">Kâr</th></tr></thead>
           <tbody>${d.byProduct
             .map(
               (p) =>
                 `<tr><td>${esc(p.name)}</td><td class="num">${p.qty}</td><td class="num">${esc(TL(p.revenue))}</td><td class="num">${esc(TL(p.profit))}</td></tr>`,
             )
             .join("")}</tbody>
         </table>`
      : "";

  const odemeTablo =
    s.orderCount > 0
      ? `<h2>Ödeme Türü</h2>
         <table class="grid">
           <thead><tr><th>Tür</th><th class="num">Adisyon</th><th class="num">Tutar</th><th class="num">Pay</th></tr></thead>
           <tbody>${d.byMethod
             .map((m) => {
               const pct =
                 s.revenue > 0 ? Math.round((m.amount / s.revenue) * 100) : 0;
               return `<tr><td>${esc(methodLabel(m.method))}</td><td class="num">${m.count}</td><td class="num">${esc(TL(m.amount))}</td><td class="num">%${pct}</td></tr>`;
             })
             .join("")}</tbody>
         </table>`
      : "";

  const bos =
    s.orderCount === 0
      ? `<p class="empty">Seçili kapsam için ${esc(opts.branchName)} şubesinde kapanmış adisyon yok.</p>`
      : "";

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>${esc(baslik)} — ${esc(opts.branchName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1f2937; margin: 28px; font-size: 12px; }
  header { border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-bottom: 16px; }
  header h1 { margin: 0; font-size: 18px; color: #111827; }
  header .meta { margin-top: 4px; color: #6b7280; font-size: 12px; }
  h2 { font-size: 13px; margin: 18px 0 6px; color: #111827; }
  table { width: 100%; border-collapse: collapse; }
  table.summary td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
  table.summary td:first-child { color: #6b7280; }
  table.grid th, table.grid td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; text-align: left; }
  table.grid th { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .empty { color: #6b7280; padding: 14px 0; }
  footer { margin-top: 24px; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  @media print { body { margin: 12mm; } }
</style></head>
<body>
  <header>
    <h1>${esc(baslik)}</h1>
    <div class="meta">${esc(opts.branchName)} · ${esc(opts.scope)}</div>
  </header>
  <h2>Özet</h2>
  <table class="summary"><tbody>${ozetRows}</tbody></table>
  ${bos}
  ${gunlukTablo}
  ${urunTablo}
  ${odemeTablo}
  <footer>Orwion POS — Satış Raporu</footer>
</body></html>`;
}

/** HTML'i gizli iframe'de açıp yazdırma diyaloğunu tetikler. */
function printHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    return;
  }
  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    iframe.remove();
  };
  doc.open();
  doc.write(html);
  doc.close();
  win.onafterprint = cleanup;
  // İçerik yerleşsin diye küçük gecikme; sonra yazdır.
  setTimeout(() => {
    win.focus();
    win.print();
    // Bazı tarayıcılarda onafterprint tetiklenmez → güvenli temizlik.
    setTimeout(cleanup, 60_000);
  }, 250);
}

export function Rapor({
  branchId,
  branchName,
}: {
  branchId: string;
  branchName: string;
}) {
  const [mode, setMode] = useState<Mode>("gun");
  // SSR-güvenli: ilk değerler ("") istemcide atanır (hydration uyumu).
  const [dates, setDates] = useState({ day: "", from: "", to: "" });
  const { day, from, to } = dates;
  const [data, setData] = useState<SalesReport | null>(null);

  // Varsayılanlar: gün = bugün, dönem = son 7 gün. Tek setState (mount).
  useEffect(() => {
    const t = todayLocal();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDates({ day: t, from: shiftDay(t, -6), to: t });
  }, []);

  // Etkin aralık (gün modu → from=to=day).
  const range = useMemo(() => {
    if (mode === "gun") return { from: day, to: day };
    return { from, to };
  }, [mode, day, from, to]);

  // Aralık/şube değişince gerçek raporu çek.
  useEffect(() => {
    if (!range.from || !range.to) return;
    let alive = true;
    fetchSalesReport(range.from, range.to, branchId)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setData(EMPTY);
      });
    return () => {
      alive = false;
    };
  }, [range.from, range.to, branchId]);

  const d = data ?? EMPTY;
  const s = d.summary;
  const multiDay = d.byDay.length > 1;

  // Hızlı dönem ön-ayarları (dönem modu).
  const applyPreset = (days: number) => {
    const t = todayLocal();
    setMode("donem");
    setDates((p) => ({ ...p, from: shiftDay(t, -(days - 1)), to: t }));
  };
  const applyThisMonth = () => {
    const t = todayLocal();
    setMode("donem");
    setDates((p) => ({ ...p, from: t.slice(0, 8) + "01", to: t }));
  };

  // PDF çıktısı: o anki seçili rapor → yazdır/PDF olarak kaydet.
  const exportPdf = () => {
    const scope =
      mode === "gun"
        ? day || "—"
        : `${range.from || "—"} → ${range.to || "—"}`;
    printHtml(buildReportHtml(d, { mode, branchName, scope }));
  };

  const dateInput =
    "bg-transparent text-sm font-bold text-ink outline-none";
  const dateBox =
    "flex items-center gap-2 rounded-xl border border-line2 bg-white px-3 py-2 text-sm font-bold text-ink2";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Raporlar — Satış"
        icon={BarChart3}
        right={
          <div className="flex items-center gap-2">
            <GhostButton
              icon={FileDown}
              onClick={exportPdf}
              disabled={!data}
              className="py-2"
            >
              PDF İndir
            </GhostButton>
            {mode === "gun" ? (
              <label className={dateBox}>
                <CalendarDays className="h-4 w-4 text-ink3" strokeWidth={2.2} />
                <input
                  type="date"
                  value={day}
                  onChange={(e) =>
                    setDates((p) => ({ ...p, day: e.target.value }))
                  }
                  className={dateInput}
                />
              </label>
            ) : (
              <label className={dateBox}>
                <CalendarRange className="h-4 w-4 text-ink3" strokeWidth={2.2} />
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) =>
                    setDates((p) => ({ ...p, from: e.target.value }))
                  }
                  className={dateInput}
                />
                <span className="text-ink3">→</span>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) =>
                    setDates((p) => ({ ...p, to: e.target.value }))
                  }
                  className={dateInput}
                />
              </label>
            )}
          </div>
        }
      />

      <div className="scroll-light space-y-4 overflow-y-auto px-7 pb-7">
        {/* Mod + kapsam + ön-ayarlar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Tab on={mode === "gun"} onClick={() => setMode("gun")}>
              Gün
            </Tab>
            <Tab on={mode === "donem"} onClick={() => setMode("donem")}>
              Dönem
            </Tab>
          </div>

          {mode === "donem" && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Preset onClick={() => applyPreset(7)}>Son 7 gün</Preset>
              <Preset onClick={() => applyPreset(30)}>Son 30 gün</Preset>
              <Preset onClick={applyThisMonth}>Bu ay</Preset>
            </div>
          )}

          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[12px] font-bold text-brand">
            <Store className="h-3.5 w-3.5" strokeWidth={2.4} />
            {branchName}
          </span>
          <span className="text-[13px] font-semibold text-ink2">
            {mode === "gun"
              ? day || "—"
              : `${range.from || "—"} → ${range.to || "—"}`}
          </span>
        </div>

        {/* Özet kutuları — gerçek order'lardan */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Stat icon={Wallet} label="Toplam Ciro" value={TL(s.revenue)} tone="orange" />
          <Stat icon={Coins} label="Toplam Maliyet" value={TL(s.cost)} tone="rose" />
          <Stat icon={TrendingUp} label="Kâr" value={TL(s.profit)} tone="green" />
          <Stat icon={Percent} label="Kâr Marjı" value={"%" + s.margin} tone="sky" />
          <Stat icon={Receipt} label="Adisyon Sayısı" value={s.orderCount + ""} tone="violet" />
        </div>

        {data && s.orderCount === 0 && (
          <div className="rounded-2xl border border-dashed border-line2 bg-surface2/40 py-10 text-center text-sm text-ink3">
            Seçili {mode === "gun" ? "gün" : "dönem"} için {branchName} şubesinde
            kapanmış adisyon yok.
          </div>
        )}

        {s.orderCount > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Günlük dağılım (yalnızca çok günlü dönemde) */}
            {multiDay && (
              <Card title="Günlük Dağılım" icon={CalendarRange} className="lg:col-span-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-bold tracking-wide text-ink3 uppercase">
                        <th className="pb-2">Tarih</th>
                        <th className="pb-2 text-right">Ciro</th>
                        <th className="pb-2 text-right">Maliyet</th>
                        <th className="pb-2 text-right">Kâr</th>
                        <th className="pb-2 text-right">Adisyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.byDay.map((row) => (
                        <tr key={row.date} className="border-t border-line">
                          <td className="py-2 font-semibold text-ink">{row.date}</td>
                          <td className="py-2 text-right tnum text-ink2">{TL(row.revenue)}</td>
                          <td className="py-2 text-right tnum text-ink3">{TL(row.cost)}</td>
                          <td className="py-2 text-right tnum font-semibold text-emerald-600">
                            {TL(row.profit)}
                          </td>
                          <td className="py-2 text-right tnum text-ink2">{row.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* En çok satanlar */}
            <Card title="En Çok Satan Ürünler" icon={Package}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold tracking-wide text-ink3 uppercase">
                      <th className="pb-2">Ürün</th>
                      <th className="pb-2 text-right">Adet</th>
                      <th className="pb-2 text-right">Ciro</th>
                      <th className="pb-2 text-right">Kâr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.byProduct.slice(0, 15).map((p) => (
                      <tr key={p.pid} className="border-t border-line">
                        <td className="py-2 font-semibold text-ink">{p.name}</td>
                        <td className="py-2 text-right tnum text-ink2">{p.qty}</td>
                        <td className="py-2 text-right tnum text-ink2">{TL(p.revenue)}</td>
                        <td className="py-2 text-right tnum font-semibold text-emerald-600">
                          {TL(p.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {d.byProduct.length > 15 && (
                  <p className="mt-2 text-[12px] text-ink3">
                    İlk 15 ürün gösteriliyor (toplam {d.byProduct.length}).
                  </p>
                )}
              </div>
            </Card>

            {/* Ödeme türü kırılımı */}
            <Card title="Ödeme Türü" icon={CreditCard}>
              <div className="space-y-2.5">
                {d.byMethod.map((m) => {
                  const pct =
                    s.revenue > 0 ? Math.round((m.amount / s.revenue) * 100) : 0;
                  return (
                    <div key={m.method}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink">
                          {methodLabel(m.method)}
                          <span className="ml-1.5 text-[12px] font-normal text-ink3">
                            ({m.count} adisyon)
                          </span>
                        </span>
                        <span className="tnum font-semibold text-ink2">
                          {TL(m.amount)}
                          <span className="ml-1.5 text-[12px] text-ink3">%{pct}</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand to-brand2"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* Küçük dönem ön-ayar düğmesi (Tab'tan daha hafif). */
function Preset({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-line2 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink2 transition hover:bg-surface2 hover:text-ink"
    >
      {children}
    </button>
  );
}
