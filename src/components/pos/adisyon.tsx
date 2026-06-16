"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CATS,
  HALLS,
  KDV_ORAN,
  PRODUCTS,
  TL,
  TLk,
  elapsed,
  itemCount,
  lineTotal,
  orderTotal,
  prodById,
  type Table,
} from "@/lib/pos-data";
import { Food } from "./food";
import { Row } from "./ui";

export function Adisyon({
  t,
  onBack,
  addItem,
  decItem,
  askBill,
  payTable,
  clockMin,
}: {
  t: Table;
  onBack: () => void;
  addItem: (no: string, pid: string) => void;
  decItem: (no: string, pid: string) => void;
  askBill: (no: string) => void;
  payTable: (no: string) => void;
  clockMin: number;
}) {
  const [cat, setCat] = useState(CATS[0].id);
  const [q, setQ] = useState("");
  const list = PRODUCTS.filter((p) =>
    q ? p.name.toLowerCase().includes(q.toLowerCase()) : p.cat === cat,
  );
  const ara = orderTotal(t.items);
  const kdv = ara - ara / (1 + KDV_ORAN);
  const hall = HALLS.find((h) => h.id === t.hall)?.name;

  return (
    <div className="flex min-h-0 flex-1">
      {/* SOL: kategoriler */}
      <div className="flex w-[150px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-[#EBE5DB] bg-white px-3 py-4">
        <button
          onClick={onBack}
          className="text-espresso/60 hover:text-espresso mb-1 flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold hover:bg-[#F4F1EC]"
        >
          ← Masalar
        </button>
        {CATS.map((c) => {
          const on = !q && cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                setQ("");
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border py-3 text-center transition",
                on
                  ? "soft border-transparent text-white"
                  : "text-espresso/70 hover:border-espresso/20 border-[#ECE6DC] bg-[#FBFAF7]",
              )}
              style={on ? { background: c.color } : undefined}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-[11px] leading-tight font-bold">{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* ORTA: ürün ızgarası */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 px-6 pt-5 pb-3">
          <div>
            <h2 className="font-display text-xl font-extrabold">
              Masa {t.no}{" "}
              <span className="text-espresso/35 text-base font-semibold">
                · {hall}
              </span>
            </h2>
            <p className="text-espresso/45 text-xs">
              {t.seats} kişilik · {t.waiter || "—"}{" "}
              {t.startedAt != null ? "· " + elapsed(t.startedAt, clockMin) : ""}
            </p>
          </div>
          <div className="relative ml-auto">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ürün ara…"
              className="focus:border-amber0 h-10 w-56 rounded-xl border border-[#E6E0D6] bg-white pr-3 pl-9 text-sm outline-none"
            />
            <span className="text-espresso/35 absolute top-1/2 left-3 -translate-y-1/2">
              🔍
            </span>
          </div>
        </div>
        <div className="overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => addItem(t.no, p.id)}
                className="group soft lift overflow-hidden rounded-2xl border border-[#EDE7DD] bg-white text-left"
              >
                <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-24 w-full" />
                <div className="px-3 py-2.5">
                  <div className="line-clamp-1 text-sm leading-tight font-bold">
                    {p.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-display text-amber1 tnum font-extrabold">
                      {TLk(p.price)}₺
                    </span>
                    <span className="text-espresso/50 group-hover:bg-amber0 grid h-6 w-6 place-items-center rounded-lg bg-[#F4F1EC] text-sm font-bold transition group-hover:text-white">
                      +
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SAĞ: adisyon fişi */}
      <div className="flex w-[340px] shrink-0 flex-col border-l border-[#EBE5DB] bg-white">
        <div className="from-espresso to-espresso2 bg-gradient-to-br px-5 pt-5 pb-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold tracking-widest text-white/45 uppercase">
                Adisyon
              </div>
              <div className="font-display text-2xl font-extrabold">
                Masa {t.no}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold text-white/45">
                {itemCount(t.items)} ürün
              </div>
              <div className="tnum text-[11px] font-semibold text-white/45">
                {t.startedAt != null ? elapsed(t.startedAt, clockMin) : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {t.items.length === 0 && (
            <div className="text-espresso/35 grid h-full place-items-center px-6 text-center text-sm">
              <div>
                <div className="mb-2 text-4xl">🧾</div>
                Soldaki ürünlere dokunarak
                <br />
                adisyona ekleyin
              </div>
            </div>
          )}
          <div className="space-y-2">
            {t.items.map((it) => {
              const p = prodById[it.pid];
              return (
                <div
                  key={it.pid}
                  className="pop flex items-center gap-3 rounded-xl border border-[#EFE9DF] bg-[#FBFAF7] p-2"
                >
                  <Food
                    img={p.img}
                    emoji={p.emoji}
                    grad={p.grad}
                    className="h-11 w-11 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm leading-tight font-bold">
                      {p.name}
                    </div>
                    <div className="text-espresso/45 tnum text-xs">
                      {TLk(p.price)}₺
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => decItem(t.no, it.pid)}
                      className="text-espresso/60 h-7 w-7 rounded-lg border border-[#E6E0D6] bg-white font-bold hover:bg-rose-50 hover:text-rose-600"
                    >
                      −
                    </button>
                    <span className="tnum w-5 text-center font-bold">{it.qty}</span>
                    <button
                      onClick={() => addItem(t.no, it.pid)}
                      className="text-espresso/60 h-7 w-7 rounded-lg border border-[#E6E0D6] bg-white font-bold hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      +
                    </button>
                  </div>
                  <div className="font-display tnum w-16 text-right text-sm font-extrabold">
                    {TLk(lineTotal(it))}₺
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#EBE5DB] px-5 py-4">
          <div className="space-y-1 text-sm">
            <Row k="Ara Toplam" v={TL(ara)} />
            <Row k={"KDV (%" + KDV_ORAN * 100 + ")"} v={TL(kdv)} muted />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#E0D8CC] pt-3">
            <span className="font-bold">TOPLAM</span>
            <span className="font-display text-amber1 tnum text-2xl font-extrabold">
              {TL(ara)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => askBill(t.no)}
              disabled={!t.items.length}
              className="text-espresso/70 rounded-xl border border-[#E6E0D6] py-3 text-sm font-bold hover:bg-[#F4F1EC] disabled:opacity-40"
            >
              🧾 Hesap İste
            </button>
            <button
              onClick={() => payTable(t.no)}
              disabled={!t.items.length}
              className="from-amber0 to-amber1 soft rounded-xl bg-gradient-to-r py-3 text-sm font-bold text-white hover:brightness-105 disabled:opacity-40"
            >
              💳 Ödeme Al
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
