"use client";

import { useState } from "react";
import { CATS, PRODUCTS, TL } from "@/lib/pos-data";
import { Food } from "./food";
import { Tab, TopBar } from "./ui";

export function Menu() {
  const [cat, setCat] = useState("hepsi");
  const list = PRODUCTS.filter((p) => (cat === "hepsi" ? true : p.cat === cat));
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Menü & Ürünler"
        sub={PRODUCTS.length + " ürün · " + CATS.length + " kategori"}
        right={
          <button className="from-amber0 to-amber1 soft rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white">
            + Yeni Ürün
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        <Tab on={cat === "hepsi"} onClick={() => setCat("hepsi")}>
          Tümü
        </Tab>
        {CATS.map((c) => (
          <Tab key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
            {c.emoji} {c.name}
          </Tab>
        ))}
      </div>
      <div className="overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((p) => (
            <div
              key={p.id}
              className="soft lift overflow-hidden rounded-2xl border border-[#EDE7DD] bg-white"
            >
              <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-28 w-full" />
              <div className="px-3 py-3">
                <div className="line-clamp-1 text-sm leading-tight font-bold">
                  {p.name}
                </div>
                <div className="text-espresso/40 mb-2 text-[11px] font-semibold">
                  {CATS.find((c) => c.id === p.cat)?.name} ·{" "}
                  {p.route === "bar" ? "Bar" : "Mutfak"}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-amber1 tnum font-extrabold">
                    {TL(p.price)}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
