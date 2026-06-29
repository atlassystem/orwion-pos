"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { TL, KINDS, type Product, type Category, type Kind } from "@/lib/pos-data";
import { Food } from "./food";
import { catIcon } from "./glyphs";
import { Tab, TopBar } from "./ui";

export function Menu({
  products,
  cats,
}: {
  products: Product[];
  cats: Category[];
}) {
  const [kind, setKind] = useState<"hepsi" | Kind>("hepsi");

  // Tür/kategoriye göre gruplama (sadece ürünü olan kategoriler) + "Diğer".
  const shownCats = cats
    .filter((c) => kind === "hepsi" || c.kind === kind)
    .sort((a, b) => (a.kind === "icecek" ? 1 : 0) - (b.kind === "icecek" ? 1 : 0));
  const groups = shownCats
    .map((c) => ({ c, items: products.filter((p) => p.cat === c.id) }))
    .filter((g) => g.items.length > 0);
  if (kind === "hepsi") {
    const orphan = products.filter((p) => !cats.some((c) => c.id === p.cat));
    if (orphan.length)
      groups.push({
        c: { id: "diger", name: "Diğer", emoji: "🍽️", color: "#94a3b8", kind: "yiyecek" },
        items: orphan,
      });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Menü & Ürünler"
        icon={BookOpen}
        sub={products.length + " ürün · " + cats.length + " kategori"}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        <Tab on={kind === "hepsi"} onClick={() => setKind("hepsi")}>
          Tümü
        </Tab>
        {KINDS.map((k) => (
          <Tab key={k.id} on={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </Tab>
        ))}
      </div>

      <div className="scroll-light space-y-6 overflow-y-auto px-7 pb-7">
        {groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line2 py-10 text-center text-sm text-ink3">
            Ürün yok.
          </div>
        )}
        {groups.map(({ c, items }) => {
          const Ic = catIcon(c.id);
          const bar = c.kind === "icecek";
          return (
            <div key={c.id}>
              <div className="mb-3 flex items-center gap-2">
                <Ic className="h-4.5 w-4.5 text-ink3" strokeWidth={2.2} />
                <h2 className="font-display text-base font-extrabold text-ink">{c.name}</h2>
                <span className="text-[12px] text-ink3">· {items.length}</span>
                <span
                  className={
                    "ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold " +
                    (bar ? "bg-sky-100 text-sky-700" : "bg-orange-100 text-orange-700")
                  }
                >
                  {bar ? "Bar" : "Mutfak"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((p) => (
                  <div key={p.id} className="pos-card lift overflow-hidden">
                    <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-28 w-full" />
                    <div className="px-3 py-3">
                      <div className="line-clamp-1 text-sm leading-tight font-bold text-ink">
                        {p.name}
                      </div>
                      <div className="text-[11px] font-semibold text-ink3">
                        {c.name} · {p.route === "bar" ? "Bar" : "Mutfak"}
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold">
                        {p.kcal ? <span className="text-ink3">{p.kcal} kcal</span> : null}
                        {p.meat && p.meat !== "Yok" ? (
                          <span className="text-rose-500">{p.meat}</span>
                        ) : null}
                        {p.allergens && p.allergens.length > 0 ? (
                          <span className="text-amber-600">⚠ {p.allergens.length}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-display tnum font-extrabold text-brand">
                          {TL(p.price)}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                          Aktif
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
