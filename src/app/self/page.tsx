"use client";

/* ============================================================
   Orwion POS — QR Menü & Self-Sipariş (PUBLIC, giriş gerekmez)
   Misafir: şube + masa seçer → kategorili menüden sepete ekler →
   "Siparişi Gönder" → o masanın adisyonuna düşer (ödeme yok).
   ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, Store, Plus, Minus, Check, ArrowLeft, Send, Loader2 } from "lucide-react";
import { TL, KINDS, type Product, type Category, type Kind } from "@/lib/pos-data";
import { Food } from "@/components/pos/food";
import { catIcon } from "@/components/pos/glyphs";

interface Branch { id: string; name: string; city?: string }
interface TableLite { no: string; hall: string; seats: number; status: string }
interface Hall { id: string; name: string }

export default function SelfOrderPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<TableLite[]>([]);

  const [branch, setBranch] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [started, setStarted] = useState(false); // menüye geçildi mi
  const [cart, setCart] = useState<Record<string, number>>({});
  const [kind, setKind] = useState<"hepsi" | Kind>("hepsi");

  const [busy, setBusy] = useState(false);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const [err, setErr] = useState("");

  // Katalog + şubeler (mount).
  useEffect(() => {
    fetch("/api/self/menu", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setBranches(d.branches ?? []);
        setHalls(d.halls ?? []);
        setCats(d.categories ?? []);
        setProducts(d.products ?? []);
      })
      .catch(() => setErr("Menü yüklenemedi."));
  }, []);

  // Şube seçilince o şubenin masalarını çek.
  useEffect(() => {
    if (!branch) {
      setTables([]);
      return;
    }
    let alive = true;
    fetch(`/api/self/menu?branch=${encodeURIComponent(branch)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.ok) setTables(d.tables ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [branch]);

  const shownCats = useMemo(
    () =>
      cats
        .filter((c) => kind === "hepsi" || c.kind === kind)
        .sort((a, b) => (a.kind === "icecek" ? 1 : 0) - (b.kind === "icecek" ? 1 : 0)),
    [cats, kind],
  );
  const groups = shownCats
    .map((c) => ({ c, items: products.filter((p) => p.cat === c.id) }))
    .filter((g) => g.items.length > 0);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.entries(cart).reduce((s, [pid, q]) => {
    const p = products.find((x) => x.id === pid);
    return s + (p?.price ?? 0) * q;
  }, 0);

  const add = (pid: string) => setCart((c) => ({ ...c, [pid]: (c[pid] ?? 0) + 1 }));
  const dec = (pid: string) =>
    setCart((c) => {
      const q = (c[pid] ?? 0) - 1;
      const n = { ...c };
      if (q <= 0) delete n[pid];
      else n[pid] = q;
      return n;
    });

  const branchName = branches.find((b) => b.id === branch)?.name ?? branch;
  const hallName = (id: string) => halls.find((h) => h.id === id)?.name ?? id;

  const submit = async () => {
    if (!branch || !tableNo || cartCount === 0 || busy) return;
    setBusy(true);
    setErr("");
    try {
      const items = Object.entries(cart).map(([pid, qty]) => ({ pid, qty }));
      const res = await fetch("/api/self/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, no: tableNo, items }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setDoneCount(d.added ?? cartCount);
        setCart({});
      } else if (res.status === 404) {
        setErr("Masa bulunamadı. Lütfen masayı yeniden seçin.");
      } else if (res.status === 429) {
        setErr("Çok sık deneme. Lütfen biraz bekleyin.");
      } else {
        setErr("Sipariş gönderilemedi. Tekrar deneyin.");
      }
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Onay ekranı ---------- */
  if (doneCount !== null) {
    return (
      <Shell>
        <div className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-8 w-8" strokeWidth={2.6} />
          </div>
          <h1 className="font-display text-xl font-extrabold text-ink">Siparişiniz alındı!</h1>
          <p className="mt-2 text-sm text-ink2">
            {branchName} · Masa {tableNo} için {doneCount} ürün mutfağa/bara iletildi.
            Hesabınız her şey dahil; ödeme gerekmez.
          </p>
          <button
            onClick={() => setDoneCount(null)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand2"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Yeni sipariş ekle
          </button>
        </div>
      </Shell>
    );
  }

  /* ---------- Şube + masa seçimi ---------- */
  if (!started || !branch || !tableNo) {
    return (
      <Shell>
        <div className="mx-auto mt-6 max-w-md rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h1 className="font-display text-lg font-extrabold text-ink">Hoş geldiniz</h1>
          <p className="mt-1 text-sm text-ink2">Sipariş için şube ve masanızı seçin.</p>

          <div className="mt-5">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink2">Şube</span>
            <div className="grid grid-cols-2 gap-2">
              {branches.map((b) => {
                const on = branch === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBranch(b.id);
                      setTableNo("");
                    }}
                    className={
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition " +
                      (on
                        ? "border-brand bg-brand text-white shadow-sm shadow-brand/30"
                        : "border-line2 bg-surface2 text-ink2 hover:bg-white hover:text-ink")
                    }
                  >
                    <Store className="h-4 w-4" strokeWidth={2.2} />
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink2">Masa</span>
            <select
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              disabled={!branch}
              className="h-12 w-full rounded-xl border border-line2 bg-surface2 px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand/60 focus:bg-white disabled:opacity-50"
            >
              <option value="">{branch ? "Masa seçin…" : "Önce şube seçin"}</option>
              {tables.map((t) => (
                <option key={t.no} value={t.no}>
                  Masa {t.no} · {hallName(t.hall)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setStarted(true)}
            disabled={!branch || !tableNo}
            className="mt-6 w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Menüye Geç
          </button>
          {err && <p className="mt-3 text-center text-[13px] font-semibold text-rose-600">{err}</p>}
        </div>
      </Shell>
    );
  }

  /* ---------- Menü + sepet ---------- */
  return (
    <Shell>
      {/* Seçim çubuğu */}
      <div className="sticky top-0 z-10 mb-4 flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 shadow-sm">
        <button
          onClick={() => setStarted(false)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-ink2 transition hover:bg-surface2"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
          Değiştir
        </button>
        <span className="ml-auto text-sm font-bold text-ink">
          {branchName} · <span className="text-brand">Masa {tableNo}</span>
        </span>
      </div>

      {/* Tür filtresi */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ id: "hepsi", label: "Tümü" }, ...KINDS].map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id as "hepsi" | Kind)}
            className={
              "rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition " +
              (kind === k.id
                ? "bg-brand text-white ring-brand/0 shadow-sm shadow-brand/30"
                : "bg-white text-ink2 ring-line2 hover:bg-surface2")
            }
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Kategoriye göre gruplu menü */}
      <div className="space-y-6 pb-28">
        {groups.map(({ c, items }) => {
          const Ic = catIcon(c.id);
          return (
            <div key={c.id}>
              <div className="mb-3 flex items-center gap-2">
                <Ic className="h-4.5 w-4.5 text-ink3" strokeWidth={2.2} />
                <h2 className="font-display text-base font-extrabold text-ink">{c.name}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => {
                  const q = cart[p.id] ?? 0;
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
                      <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-16 w-16 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-bold text-ink">{p.name}</div>
                        <div className="font-display tnum font-extrabold text-brand">{TL(p.price)}</div>
                      </div>
                      {q === 0 ? (
                        <button
                          onClick={() => add(p.id)}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm transition hover:bg-brand2"
                          aria-label="Ekle"
                        >
                          <Plus className="h-5 w-5" strokeWidth={2.6} />
                        </button>
                      ) : (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button onClick={() => dec(p.id)} aria-label="Azalt" className="grid h-9 w-9 place-items-center rounded-lg border border-line2 bg-white text-ink2 transition hover:bg-rose-50 hover:text-rose-600">
                            <Minus className="h-4 w-4" strokeWidth={2.6} />
                          </button>
                          <span className="tnum w-6 text-center font-bold text-ink">{q}</span>
                          <button onClick={() => add(p.id)} aria-label="Artır" className="grid h-9 w-9 place-items-center rounded-lg border border-line2 bg-white text-ink2 transition hover:bg-emerald-50 hover:text-emerald-600">
                            <Plus className="h-4 w-4" strokeWidth={2.6} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sepet çubuğu (sabit alt) */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="text-sm">
              <div className="font-bold text-ink">{cartCount} ürün</div>
              <div className="tnum text-[12px] text-ink3">{TL(cartTotal)}</div>
            </div>
            <button
              onClick={submit}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} /> : <Send className="h-4 w-4" strokeWidth={2.4} />}
              {busy ? "Gönderiliyor…" : "Siparişi Gönder"}
            </button>
          </div>
          {err && <p className="mx-auto mt-2 max-w-5xl text-[13px] font-semibold text-rose-600">{err}</p>}
        </div>
      )}
    </Shell>
  );
}

/* Sayfa kabuğu — marka başlığı + arka plan (POS kabuğundan bağımsız). */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f4f6] font-sans text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-sm">
            <UtensilsCrossed className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          <div className="text-[17px] font-extrabold tracking-tight text-ink">
            Orwion<span className="ml-1 text-brand">POS</span>
          </div>
          <span className="ml-auto text-[12px] font-semibold text-ink3">QR Menü · Self-Sipariş</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
    </div>
  );
}
