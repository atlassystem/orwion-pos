"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Boxes,
  Plus,
  AlertTriangle,
  PackageCheck,
  Wallet,
  Package,
  BookOpenCheck,
  ChefHat,
  Percent,
  ReceiptText,
  X,
  Trash2,
  Check,
  SquarePen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATS, PRODUCTS, TL, TLk, type Product } from "@/lib/pos-data";
import {
  STOCK,
  STOCK_CATS,
  stockById,
  isLow,
  stockValue,
  recipeCost,
  portionsPossible,
  type StockItem,
  type RecipeLine,
} from "@/lib/pos-modules";
import { PrimaryButton, Stat, Tab, TopBar } from "./ui";
import { usePerms } from "./perms";
import { Food } from "./food";

export function Stok({
  stock,
  recipes,
  setRecipes,
  onStockIn,
}: {
  stock: StockItem[];
  recipes: Record<string, RecipeLine[]>;
  setRecipes: Dispatch<SetStateAction<Record<string, RecipeLine[]>>>;
  onStockIn: (id: string, qty: number) => void;
}) {
  const { canEdit } = usePerms();
  const [tab, setTab] = useState<"envanter" | "recete">("envanter");
  const [stockInOpen, setStockInOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Stok & Envanter"
        icon={Boxes}
        sub={stock.length + " kalem · " + Object.keys(recipes).length + " reçete"}
        right={
          tab === "envanter" ? (
            <PrimaryButton
              icon={Plus}
              onClick={() => canEdit && setStockInOpen(true)}
            >
              Stok Girişi
            </PrimaryButton>
          ) : undefined
        }
      />

      {stockInOpen && (
        <StockInModal
          stock={stock}
          onClose={() => setStockInOpen(false)}
          onSave={(id, qty) => {
            onStockIn(id, qty);
            setStockInOpen(false);
          }}
        />
      )}

      <div className="mb-4 flex items-center gap-2 px-7">
        <Tab on={tab === "envanter"} onClick={() => setTab("envanter")}>
          <span className="inline-flex items-center gap-1.5">
            <Package className="h-4 w-4" strokeWidth={2.1} />
            Envanter
          </span>
        </Tab>
        <Tab on={tab === "recete"} onClick={() => setTab("recete")}>
          <span className="inline-flex items-center gap-1.5">
            <BookOpenCheck className="h-4 w-4" strokeWidth={2.1} />
            Reçeteler
          </span>
        </Tab>
      </div>

      {tab === "envanter" ? (
        <Envanter stock={stock} />
      ) : (
        <Receteler recipes={recipes} setRecipes={setRecipes} stock={stock} />
      )}
    </div>
  );
}

/* ============================================================
   Envanter — stok kalemleri tablosu
   ============================================================ */
function Envanter({ stock }: { stock: StockItem[] }) {
  const [cat, setCat] = useState("hepsi");
  const list = stock.filter((s) => (cat === "hepsi" ? true : s.cat === cat));
  const low = stock.filter(isLow);
  const toplamDeger = stock.reduce((s, i) => s + stockValue(i), 0);

  return (
    <>
      <div className="mb-4 grid grid-cols-4 gap-4 px-7">
        <Stat icon={Wallet} label="Envanter Değeri" value={TL(toplamDeger)} tone="orange" />
        <Stat icon={Package} label="Toplam Kalem" value={stock.length + ""} tone="sky" />
        <Stat icon={AlertTriangle} label="Kritik Stok" value={low.length + " kalem"} tone="rose" />
        <Stat icon={PackageCheck} label="Yeterli Stok" value={stock.length - low.length + " kalem"} tone="green" />
      </div>

      {low.length > 0 && (
        <div className="mx-7 mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {low.length} kalem kritik seviyede:{" "}
          <span className="text-rose-700">{low.map((l) => l.name).join(", ")}</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        <Tab on={cat === "hepsi"} onClick={() => setCat("hepsi")}>
          Tümü
        </Tab>
        {STOCK_CATS.map((c) => (
          <Tab key={c} on={cat === c} onClick={() => setCat(c)}>
            {c}
          </Tab>
        ))}
      </div>

      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="pos-card overflow-hidden">
          <div className="grid grid-cols-[2fr_1.2fr_1.4fr_1fr_1.2fr] gap-3 border-b border-line bg-surface2 px-5 py-3 text-[11px] font-bold tracking-wide text-ink3 uppercase">
            <span>Ürün</span>
            <span>Kategori</span>
            <span>Stok Durumu</span>
            <span className="text-right">Birim Maliyet</span>
            <span className="text-right">Toplam Değer</span>
          </div>
          {list.map((s) => (
            <StockRow key={s.id} s={s} />
          ))}
        </div>
      </div>
    </>
  );
}

function StockRow({ s }: { s: StockItem }) {
  const low = isLow(s);
  const pct = Math.min(100, (s.qty / (s.min * 2)) * 100);
  return (
    <div className="grid grid-cols-[2fr_1.2fr_1.4fr_1fr_1.2fr] items-center gap-3 border-b border-line px-5 py-3 last:border-0 hover:bg-surface2/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          {low && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500 blink" />}
          <span className="truncate">{s.name}</span>
        </div>
        <div className="text-[11px] text-ink3">{s.supplier}</div>
      </div>
      <span className="text-xs font-semibold text-ink2">{s.cat}</span>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className={cn("tnum font-bold", low ? "text-rose-600" : "text-ink")}>
            {s.qty} {s.unit}
          </span>
          <span className="tnum text-[11px] text-ink3">min {s.min}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
          <div
            className={cn(
              "h-full rounded-full",
              low ? "bg-rose-500" : pct > 75 ? "bg-emerald-500" : "bg-amber-500",
            )}
            style={{ width: pct + "%" }}
          />
        </div>
      </div>
      <span className="tnum text-right text-sm font-semibold text-ink2">{TL(s.cost)}</span>
      <span className="font-display tnum text-right text-sm font-extrabold text-ink">
        {TL(stockValue(s))}
      </span>
    </div>
  );
}

/* ============================================================
   Reçeteler — menü ürünü → stok malzemeleri, maliyet & kâr marjı
   ============================================================ */
function Receteler({
  recipes,
  setRecipes,
  stock,
}: {
  recipes: Record<string, RecipeLine[]>;
  setRecipes: Dispatch<SetStateAction<Record<string, RecipeLine[]>>>;
  stock: StockItem[];
}) {
  const { canEdit } = usePerms();
  const [cat, setCat] = useState("hepsi");
  const [editing, setEditing] = useState<Product | null>(null);

  const list = PRODUCTS.filter((p) => (cat === "hepsi" ? true : p.cat === cat));
  const withRecipe = PRODUCTS.filter((p) => (recipes[p.id]?.length ?? 0) > 0);
  const avgCost = withRecipe.length
    ? withRecipe.reduce((s, p) => s + recipeCost(recipes[p.id]), 0) / withRecipe.length
    : 0;
  const avgMargin = withRecipe.length
    ? withRecipe.reduce((s, p) => {
        const c = recipeCost(recipes[p.id]);
        return s + (p.price > 0 ? ((p.price - c) / p.price) * 100 : 0);
      }, 0) / withRecipe.length
    : 0;

  const saveRecipe = (pid: string, lines: RecipeLine[]) =>
    setRecipes((r) => {
      const next = { ...r };
      if (lines.length) next[pid] = lines;
      else delete next[pid];
      return next;
    });

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-4 px-7">
        <Stat icon={BookOpenCheck} label="Reçeteli Ürün" value={withRecipe.length + " / " + PRODUCTS.length} tone="orange" />
        <Stat icon={ReceiptText} label="Ort. Maliyet" value={TL(avgCost)} tone="sky" />
        <Stat icon={Percent} label="Ort. Kâr Marjı" value={"%" + Math.round(avgMargin)} tone="green" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        <Tab on={cat === "hepsi"} onClick={() => setCat("hepsi")}>
          Tümü
        </Tab>
        {CATS.map((c) => (
          <Tab key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
            {c.name}
          </Tab>
        ))}
      </div>

      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <RecipeCard
              key={p.id}
              p={p}
              lines={recipes[p.id] ?? []}
              stock={stock}
              canEdit={canEdit}
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      </div>

      {editing && (
        <RecipeModal
          product={editing}
          initial={recipes[editing.id] ?? []}
          onClose={() => setEditing(null)}
          onSave={(lines) => {
            saveRecipe(editing.id, lines);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function marginTone(m: number) {
  if (m >= 60) return "bg-emerald-100 text-emerald-700";
  if (m >= 35) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function portionTone(n: number) {
  if (n <= 0) return "bg-rose-100 text-rose-700";
  if (n < 5) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function RecipeCard({
  p,
  lines,
  stock,
  canEdit,
  onEdit,
}: {
  p: Product;
  lines: RecipeLine[];
  stock: StockItem[];
  canEdit: boolean;
  onEdit: () => void;
}) {
  const cost = recipeCost(lines);
  const margin = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
  const has = lines.length > 0;
  const portions = has ? portionsPossible(lines, stock) : Infinity;

  return (
    <div className="pos-card flex flex-col p-4">
      <div className="flex items-center gap-3">
        <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{p.name}</div>
          <div className="text-[11px] font-semibold text-ink3">
            {CATS.find((c) => c.id === p.cat)?.name} · {TLk(p.price)}₺
          </div>
        </div>
        {has && (
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", marginTone(margin))}>
            %{Math.round(margin)}
          </span>
        )}
      </div>

      {/* Kalan porsiyon */}
      {has && (
        <div className={cn("mt-3 flex items-center justify-between rounded-xl px-3 py-2", portionTone(portions))}>
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <ChefHat className="h-3.5 w-3.5" strokeWidth={2.4} />
            Stokla yapılabilir
          </span>
          <span className="font-display tnum text-sm font-extrabold">
            {portions <= 0 ? "Tükendi" : "≈ " + portions + " porsiyon"}
          </span>
        </div>
      )}

      {/* Malzemeler */}
      <div className="mt-3 flex-1">
        {has ? (
          <div className="flex flex-wrap gap-1.5">
            {lines.map((l, i) => {
              const s = stockById[l.stockId];
              if (!s) return null;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-lg bg-surface2 px-2 py-1 text-[11px] font-semibold text-ink2 ring-1 ring-line"
                >
                  {s.name}
                  <span className="tnum text-ink3">
                    {l.qty} {s.unit}
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line2 py-3 text-center text-[12px] text-ink3">
            Reçete tanımlı değil
          </div>
        )}
      </div>

      {/* Maliyet & aksiyon */}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <div>
          <div className="text-[10px] font-bold tracking-wide text-ink3 uppercase">Maliyet</div>
          <div className="font-display tnum text-base font-extrabold text-ink">{TL(cost)}</div>
        </div>
        <button
          onClick={onEdit}
          disabled={!canEdit}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition disabled:opacity-40",
            has
              ? "border border-line2 bg-white text-ink2 hover:bg-surface2 hover:text-ink"
              : "bg-brand text-white shadow-sm shadow-brand/30 hover:bg-brand2",
          )}
        >
          {has ? <SquarePen className="h-4 w-4" strokeWidth={2.2} /> : <Plus className="h-4 w-4" strokeWidth={2.6} />}
          {has ? "Düzenle" : "Reçete Ekle"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Reçete düzenleyici modalı — malzeme ekle/çıkar
   ============================================================ */
function RecipeModal({
  product,
  initial,
  onClose,
  onSave,
}: {
  product: Product;
  initial: RecipeLine[];
  onClose: () => void;
  onSave: (lines: RecipeLine[]) => void;
}) {
  const [lines, setLines] = useState<RecipeLine[]>(
    initial.length ? initial.map((l) => ({ ...l })) : [{ stockId: STOCK[0].id, qty: 0.1 }],
  );

  const valid = lines.filter((l) => l.stockId && l.qty > 0);
  const cost = recipeCost(valid);
  const margin = product.price > 0 ? ((product.price - cost) / product.price) * 100 : 0;

  const addLine = () => setLines((ls) => [...ls, { stockId: STOCK[0].id, qty: 0.1 }]);
  const update = (i: number, patch: Partial<RecipeLine>) =>
    setLines((ls) => ls.map((l, x) => (x === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => setLines((ls) => ls.filter((_, x) => x !== i));

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="pop flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <Food img={product.img} emoji={product.emoji} grad={product.grad} className="h-10 w-10 rounded-xl" />
            <div className="leading-tight">
              <h3 className="font-display text-base font-extrabold text-ink">{product.name}</h3>
              <div className="text-[11px] text-ink3">Reçete · satış {TLk(product.price)}₺</div>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink3 transition hover:bg-surface2 hover:text-ink">
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="scroll-light flex-1 space-y-2 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-[1fr_92px_36px] gap-2 px-1 text-[11px] font-bold tracking-wide text-ink3 uppercase">
            <span>Malzeme</span>
            <span>Miktar</span>
            <span />
          </div>
          {lines.map((l, i) => {
            const s = stockById[l.stockId];
            return (
              <div key={i} className="grid grid-cols-[1fr_92px_36px] items-center gap-2">
                <select
                  value={l.stockId}
                  onChange={(e) => update(i, { stockId: e.target.value })}
                  className="h-10 rounded-xl border border-line2 bg-surface2 px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand/60 focus:bg-white"
                >
                  {STOCK.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.unit})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 rounded-xl border border-line2 bg-surface2 px-2.5 transition focus-within:border-brand/60 focus-within:bg-white">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={l.qty}
                    onChange={(e) => update(i, { qty: parseFloat(e.target.value) || 0 })}
                    className="h-10 w-full bg-transparent text-sm font-semibold text-ink outline-none"
                  />
                  <span className="text-[11px] text-ink3">{s?.unit}</span>
                </div>
                <button
                  onClick={() => remove(i)}
                  aria-label="Kaldır"
                  className="grid h-10 w-9 place-items-center rounded-xl border border-line2 bg-white text-ink3 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
            );
          })}

          <button
            onClick={addLine}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line2 py-2.5 text-sm font-bold text-ink2 transition hover:border-brand/40 hover:bg-brand-soft/40 hover:text-brand"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Malzeme Ekle
          </button>

          {/* Maliyet özeti */}
          <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-surface2 p-3 text-center">
            <Summary label="Maliyet" value={TL(cost)} />
            <Summary label="Satış" value={TLk(product.price) + "₺"} />
            <Summary
              label="Kâr Marjı"
              value={"%" + Math.round(margin)}
              tone={margin >= 60 ? "text-emerald-600" : margin >= 35 ? "text-amber-600" : "text-rose-600"}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-line2 bg-white px-4 py-2.5 text-sm font-bold text-ink2 transition hover:bg-surface2 hover:text-ink"
          >
            Vazgeç
          </button>
          <button
            onClick={() => onSave(valid)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2"
          >
            <Check className="h-4 w-4" strokeWidth={2.6} />
            Reçeteyi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-wide text-ink3 uppercase">{label}</div>
      <div className={cn("font-display tnum text-base font-extrabold", tone ?? "text-ink")}>
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   Stok Girişi — bir kaleme miktar ekle (mal kabul). Kalıcı yazılır.
   ============================================================ */
function StockInModal({
  stock,
  onClose,
  onSave,
}: {
  stock: StockItem[];
  onClose: () => void;
  onSave: (id: string, newQty: number) => void;
}) {
  const [id, setId] = useState(stock[0]?.id ?? "");
  const [add, setAdd] = useState(1);
  const item = stock.find((s) => s.id === id);
  const newQty = item ? Math.round((item.qty + (add || 0)) * 1000) / 1000 : 0;
  const valid = !!item && add > 0;

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="pop flex w-full max-w-md flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
            <PackageCheck className="h-5 w-5 text-brand" strokeWidth={2.2} />
            Stok Girişi
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink3 transition hover:bg-surface2 hover:text-ink"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Stok Kalemi</span>
            <select
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="h-11 w-full rounded-xl border border-line2 bg-surface2 px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand/60 focus:bg-white"
            >
              {stock.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.qty} {s.unit}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-ink2">
              Eklenecek Miktar {item ? "(" + item.unit + ")" : ""}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={add}
              onChange={(e) => setAdd(parseFloat(e.target.value) || 0)}
              className="h-11 w-full rounded-xl border border-line2 bg-surface2 px-3.5 text-sm font-semibold text-ink outline-none transition focus:border-brand/60 focus:bg-white"
            />
          </label>

          {item && (
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface2 p-3 text-center">
              <Summary label="Mevcut" value={item.qty + " " + item.unit} />
              <Summary label="Giriş" value={"+" + (add || 0)} tone="text-emerald-600" />
              <Summary label="Yeni" value={newQty + " " + item.unit} tone="text-brand" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-line2 bg-white px-4 py-2.5 text-sm font-bold text-ink2 transition hover:bg-surface2 hover:text-ink"
          >
            Vazgeç
          </button>
          <button
            onClick={() => valid && onSave(id, newQty)}
            disabled={!valid}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" strokeWidth={2.6} />
            Girişi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
