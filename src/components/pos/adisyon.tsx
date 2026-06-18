"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  UserRound,
  Clock,
  ScrollText,
} from "lucide-react";
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
import { catIcon } from "./glyphs";
import { Row } from "./ui";
import { usePerms } from "./perms";

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
  const { canEdit } = usePerms();
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
      <div className="flex w-[150px] shrink-0 flex-col gap-2 overflow-y-auto px-3 py-4">
        <button
          onClick={onBack}
          className="mb-1 flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-bold text-ink2 transition hover:bg-surface2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
          Masalar
        </button>
        {CATS.map((c) => {
          const on = !q && cat === c.id;
          const Ic = catIcon(c.id);
          return (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                setQ("");
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl py-3.5 text-center ring-1 transition",
                on
                  ? "bg-brand text-white ring-brand/0 shadow-sm shadow-brand/30"
                  : "bg-white text-ink2 ring-line2 hover:bg-surface2 hover:text-ink",
              )}
            >
              <Ic
                className={cn("h-6 w-6", on ? "text-white" : "text-ink3")}
                strokeWidth={2}
              />
              <span className="text-[11px] leading-tight font-bold">{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* ORTA: ürün ızgarası */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 px-6 pt-5 pb-3">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">
              Masa {t.no}{" "}
              <span className="text-base font-semibold text-ink3">· {hall}</span>
            </h2>
            <p className="flex items-center gap-3 text-xs text-ink3">
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" strokeWidth={2.2} />
                {t.seats} kişilik · {t.waiter || "—"}
              </span>
              {t.startedAt != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {elapsed(t.startedAt, clockMin)}
                </span>
              )}
            </p>
          </div>
          <div className="relative ml-auto">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ürün ara…"
              className="h-10 w-56 rounded-xl border border-line2 bg-surface2 pr-3 pl-9 text-sm text-ink placeholder:text-ink3 outline-none transition focus:border-brand/60 focus:bg-white"
            />
            <Search
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink3"
              strokeWidth={2.2}
            />
          </div>
        </div>
        <div className="scroll-light overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => addItem(t.no, p.id)}
                disabled={!canEdit}
                className="group pos-card lift overflow-hidden text-left disabled:pointer-events-none disabled:opacity-60"
              >
                <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-24 w-full" />
                <div className="px-3 py-2.5">
                  <div className="line-clamp-1 text-sm leading-tight font-bold text-ink">
                    {p.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-display tnum font-extrabold text-brand">
                      {TLk(p.price)}₺
                    </span>
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-surface2 text-ink2 ring-1 ring-line transition group-hover:bg-brand group-hover:text-white group-hover:ring-brand">
                      <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SAĞ: adisyon fişi */}
      <div className="flex w-[346px] shrink-0 flex-col border-l border-line bg-surface">
        <div className="bg-gradient-to-br from-brand to-brand2 px-5 pt-5 pb-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold tracking-widest text-white/70 uppercase">
                Adisyon
              </div>
              <div className="font-display text-2xl font-extrabold">Masa {t.no}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold text-white/70">
                {itemCount(t.items)} ürün
              </div>
              <div className="tnum text-[11px] font-semibold text-white/70">
                {t.startedAt != null ? elapsed(t.startedAt, clockMin) : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-light flex-1 overflow-y-auto px-4 py-3">
          {t.items.length === 0 && (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-ink3">
              <div>
                <ScrollText className="mx-auto mb-3 h-9 w-9 text-ink3/60" strokeWidth={1.6} />
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
                  className="pop flex items-center gap-3 rounded-xl border border-line bg-surface2 p-2"
                >
                  <Food
                    img={p.img}
                    emoji={p.emoji}
                    grad={p.grad}
                    className="h-11 w-11 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm leading-tight font-bold text-ink">
                      {p.name}
                    </div>
                    <div className="tnum text-xs text-ink3">{TLk(p.price)}₺</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => decItem(t.no, it.pid)}
                      disabled={!canEdit}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink2 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={2.6} />
                    </button>
                    <span className="tnum w-5 text-center font-bold text-ink">{it.qty}</span>
                    <button
                      onClick={() => addItem(t.no, it.pid)}
                      disabled={!canEdit}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink2 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
                    </button>
                  </div>
                  <div className="font-display tnum w-16 text-right text-sm font-extrabold text-ink">
                    {TLk(lineTotal(it))}₺
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <div className="space-y-1 text-sm">
            <Row k="Ara Toplam" v={TL(ara)} />
            <Row k={"KDV (%" + KDV_ORAN * 100 + ")"} v={TL(kdv)} muted />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dashed border-line2 pt-3">
            <span className="font-bold text-ink">TOPLAM</span>
            <span className="font-display tnum text-2xl font-extrabold text-brand">
              {TL(ara)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => askBill(t.no)}
              disabled={!t.items.length || !canEdit}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-bold text-ink2 transition hover:bg-surface2 disabled:opacity-40"
            >
              <Receipt className="h-4 w-4" strokeWidth={2.2} />
              Hesap İste
            </button>
            <button
              onClick={() => payTable(t.no)}
              disabled={!t.items.length || !canEdit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 disabled:opacity-40 disabled:shadow-none"
            >
              <CreditCard className="h-4 w-4" strokeWidth={2.2} />
              Ödeme Al
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
