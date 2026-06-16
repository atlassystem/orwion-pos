"use client";

import {
  CATS,
  TL,
  orderTotal,
  prodById,
  type Table,
} from "@/lib/pos-data";
import { Food } from "./food";
import { Stat, TopBar } from "./ui";

const ODEME = [
  { k: "Nakit", v: 9850, c: "#2FA36B" },
  { k: "Kredi Kartı", v: 12600, c: "#E7843C" },
  { k: "Yemek Çeki", v: 2400, c: "#8a5fb0" },
];

const SAATLIK: [string, number][] = [
  ["11", 1200], ["12", 3400], ["13", 5200], ["14", 3100],
  ["15", 1600], ["16", 1400], ["17", 2200], ["18", 3900],
  ["19", 6100], ["20", 7400], ["21", 5800], ["22", 3200],
];

const BASE_TOP: [string, number][] = [
  ["i1", 38], ["z1", 31], ["c1", 29], ["i2", 24], ["t1", 22],
];

export function Rapor({ tables }: { tables: Table[] }) {
  const acik = tables.filter((t) => t.items.length);
  const acikCiro = acik.reduce((s, t) => s + orderTotal(t.items), 0);
  const kapanmisCiro = 24850;
  const ciro = kapanmisCiro + acikCiro;
  const adisyon = 42;
  const ortalama = ciro / adisyon;

  const odToplam = ODEME.reduce((s, o) => s + o.v, 0);
  const maxS = Math.max(...SAATLIK.map((s) => s[1]));

  const sayac: Record<string, number> = {};
  tables.forEach((t) =>
    t.items.forEach((it) => {
      sayac[it.pid] = (sayac[it.pid] || 0) + it.qty;
    }),
  );
  const top = BASE_TOP.map(([pid, n]) => ({
    p: prodById[pid],
    n: n + (sayac[pid] || 0),
  })).sort((a, b) => b.n - a.n);
  const maxTop = Math.max(...top.map((t) => t.n));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Gün Sonu — Z Raporu"
        right={
          <>
            <button className="text-espresso/70 rounded-xl border border-[#E6E0D6] bg-white px-4 py-2.5 text-sm font-bold">
              📄 PDF
            </button>
            <button className="from-amber0 to-amber1 soft rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white">
              Gün Sonu Al
            </button>
          </>
        }
      />

      <div className="space-y-4 overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-4 gap-4">
          <Stat icon="💰" label="Toplam Ciro" value={TL(ciro)} tone="amber" />
          <Stat icon="🧾" label="Adisyon Sayısı" value={adisyon + ""} tone="green" />
          <Stat icon="📈" label="Ortalama Adisyon" value={TL(ortalama)} tone="orange" />
          <Stat icon="🟢" label="Açık Hesap" value={TL(acikCiro)} tone="slate" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="soft col-span-2 rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-extrabold">Saatlik Ciro</h3>
              <span className="text-espresso/40 text-xs font-semibold">
                En yoğun: 20:00
              </span>
            </div>
            <div className="flex h-44 items-end gap-2">
              {SAATLIK.map(([h, v]) => (
                <div key={h} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="from-amber1 to-gold/80 w-full rounded-t-lg bg-gradient-to-t"
                    style={{ height: (v / maxS) * 150 + "px" }}
                    title={TL(v)}
                  />
                  <span className="text-espresso/40 text-[10px] font-semibold">
                    {h}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="soft rounded-2xl bg-white p-5">
            <h3 className="font-display mb-4 font-extrabold">Ödeme Dağılımı</h3>
            <div className="space-y-4">
              {ODEME.map((o) => (
                <div key={o.k}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-espresso/70 flex items-center gap-2 font-semibold">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: o.c }}
                      />
                      {o.k}
                    </span>
                    <span className="tnum font-bold">{TL(o.v)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F0EBE2]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: (o.v / odToplam) * 100 + "%", background: o.c }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-dashed border-[#E0D8CC] pt-4">
              <span className="text-sm font-bold">Toplam Tahsilat</span>
              <span className="font-display text-amber1 tnum text-lg font-extrabold">
                {TL(odToplam)}
              </span>
            </div>
          </div>
        </div>

        <div className="soft rounded-2xl bg-white p-5">
          <h3 className="font-display mb-4 font-extrabold">
            En Çok Satan Ürünler
          </h3>
          <div className="space-y-3">
            {top.map((t, i) => (
              <div key={t.p.id} className="flex items-center gap-3">
                <span className="font-display text-espresso/30 w-6 text-center font-extrabold">
                  {i + 1}
                </span>
                <Food
                  img={t.p.img}
                  emoji={t.p.emoji}
                  grad={t.p.grad}
                  className="h-10 w-10 shrink-0 rounded-lg"
                />
                <div className="w-44 shrink-0">
                  <div className="text-sm leading-tight font-bold">{t.p.name}</div>
                  <div className="text-espresso/40 text-[11px]">
                    {CATS.find((c) => c.id === t.p.cat)?.name}
                  </div>
                </div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F0EBE2]">
                  <div
                    className="from-amber0 to-gold h-full rounded-full bg-gradient-to-r"
                    style={{ width: (t.n / maxTop) * 100 + "%" }}
                  />
                </div>
                <span className="tnum w-16 text-right text-sm font-bold">
                  {t.n} adet
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
