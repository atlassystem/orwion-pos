"use client";

import { useState } from "react";
import {
  ClipboardList,
  Plus,
  X,
  Check,
  Trash2,
  SquarePen,
  Tags,
  Boxes,
  Soup,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TL,
  KINDS,
  routeOfKind,
  ALLERGENS,
  MEATS,
  DEFAULT_PRODUCT_EMOJI,
  DEFAULT_PRODUCT_GRAD,
  type Product,
  type Category,
  type Route,
  type Kind,
} from "@/lib/pos-data";
import { uploadProductImage } from "@/lib/pos-api";
import { Food } from "./food";
import { catIcon } from "./glyphs";
import { PrimaryButton, Stat, Tab, TopBar } from "./ui";
import { usePerms } from "./perms";

/** Forma açılırken kullanılan boş/varsayılan ürün taslağı. */
type Draft = {
  name: string;
  cat: string;
  price: number;
  route: Route;
  img: string;
  /* Yönetmelik şeffaflık alanları */
  kcal: number;
  allergens: string[];
  meat: string;
  content: string;
};

/** Görseli istemcide en fazla ~800px'e küçültüp JPEG dataURL döndürür. */
async function resizeImage(file: File, maxPx = 800, quality = 0.82): Promise<string> {
  const readDataUrl = (f: File) =>
    new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = () => rej(new Error("read_failed"));
      fr.readAsDataURL(f);
    });
  const src = await readDataUrl(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("img_failed"));
    im.src = src;
  });
  let { width, height } = img;
  if (width > maxPx || height > maxPx) {
    const s = Math.min(maxPx / width, maxPx / height);
    width = Math.round(width * s);
    height = Math.round(height * s);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function MenuYonetim({
  products,
  cats,
  onCreate,
  onUpdate,
  onDelete,
}: {
  products: Product[];
  cats: Category[];
  onCreate: (d: Draft) => void;
  onUpdate: (id: string, d: Draft) => void;
  onDelete: (id: string) => void;
}) {
  const { canEdit } = usePerms();
  const [kind, setKind] = useState<"hepsi" | Kind>("hepsi");
  // null = kapalı, "new" = ekleme, Product = düzenleme
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const barCount = products.filter((p) => p.route === "bar").length;

  // Tür/kategoriye göre gruplama: seçili türdeki kategoriler + (kategorisi
  // bulunamayan ürünler için) "Diğer" grubu. Yalnızca ürünü olan gruplar gösterilir.
  const shownCats = cats
    .filter((c) => kind === "hepsi" || c.kind === kind)
    // Yiyecek grupları önce, içecekler sonra (kararlı sıralama).
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
        title="Menü Yönetimi"
        icon={ClipboardList}
        sub={products.length + " ürün · " + cats.length + " kategori"}
        right={
          <PrimaryButton icon={Plus} onClick={() => canEdit && setEditing("new")}>
            Yeni Ürün
          </PrimaryButton>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-4 px-7">
        <Stat icon={Boxes} label="Toplam Ürün" value={products.length + ""} tone="orange" />
        <Stat icon={Tags} label="Kategori" value={cats.length + ""} tone="sky" />
        <Stat icon={Soup} label="Mutfak / Bar" value={products.length - barCount + " / " + barCount} tone="green" />
      </div>

      {/* Tür filtresi (Tümü / Yiyecek / İçecek) */}
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

      {/* Kategoriye göre gruplanmış liste */}
      <div className="scroll-light space-y-4 overflow-y-auto px-7 pb-7">
        {groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line2 py-10 text-center text-sm text-ink3">
            Ürün yok.
          </div>
        )}
        {groups.map(({ c, items }) => {
          const Ic = catIcon(c.id);
          const bar = c.kind === "icecek";
          return (
            <div key={c.id} className="pos-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line bg-surface2 px-5 py-3">
                <Ic className="h-4 w-4 text-ink3" strokeWidth={2.2} />
                <span className="text-sm font-extrabold text-ink">{c.name}</span>
                <span className="text-[12px] text-ink3">· {items.length} ürün</span>
                <span
                  className={cn(
                    "ml-auto w-fit rounded-full px-2 py-0.5 text-[11px] font-bold",
                    bar ? "bg-sky-100 text-sky-700" : "bg-orange-100 text-orange-700",
                  )}
                >
                  {bar ? "Bar" : "Mutfak"}
                </span>
              </div>
              {items.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[2.6fr_1fr_104px] items-center gap-3 border-b border-line px-5 py-3 last:border-0 hover:bg-surface2/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">{p.name}</span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-ink3">
                        {p.kcal ? <span>{p.kcal} kcal</span> : null}
                        {p.meat && p.meat !== "Yok" ? <span className="text-rose-500">Et: {p.meat}</span> : null}
                        {p.allergens && p.allergens.length > 0 ? (
                          <span className="text-amber-600">{p.allergens.length} alerjen</span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                  <span className="font-display tnum text-right text-sm font-extrabold text-brand">
                    {TL(p.price)}
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => canEdit && setEditing(p)}
                      disabled={!canEdit}
                      aria-label="Düzenle"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line2 bg-white text-ink2 transition hover:bg-surface2 hover:text-ink disabled:opacity-40"
                    >
                      <SquarePen className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                    <button
                      onClick={() => canEdit && onDelete(p.id)}
                      disabled={!canEdit}
                      aria-label="Sil"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line2 bg-white text-ink3 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {editing && (
        <ProductModal
          cats={cats}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            if (editing === "new") onCreate(d);
            else onUpdate(editing.id, d);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   Ürün ekle/düzenle modalı — ad, kategori, fiyat, hazırlık (route)
   ============================================================ */
function ProductModal({
  product,
  cats,
  onClose,
  onSave,
}: {
  product: Product | null;
  cats: Category[];
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  // Düzenlenen ürünün türünü kategorisinden çıkar (yoksa varsayılan yiyecek).
  const initialKind: Kind =
    cats.find((c) => c.id === product?.cat)?.kind ?? "yiyecek";
  const [kind, setKind] = useState<Kind>(initialKind);
  const [name, setName] = useState(product?.name ?? "");
  const catsOfKind = cats.filter((c) => c.kind === kind);
  const [catId, setCatId] = useState(
    product?.cat ?? catsOfKind[0]?.id ?? cats[0]?.id ?? "",
  );
  const [price, setPrice] = useState(product?.price ?? 0);
  const [img, setImg] = useState(product?.img ?? "");
  const [uploading, setUploading] = useState(false);
  const [imgErr, setImgErr] = useState("");

  // Yönetmelik şeffaflık alanları.
  const [kcal, setKcal] = useState(product?.kcal ?? 0);
  const [meat, setMeat] = useState(product?.meat ?? "Yok");
  const [allergens, setAllergens] = useState<string[]>(product?.allergens ?? []);
  const [content, setContent] = useState(product?.content ?? "");
  const toggleAllergen = (a: string) =>
    setAllergens((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));

  // Route türden türetilir (yiyecek→mutfak, içecek→bar).
  const route: Route = routeOfKind(kind);

  // Tür değişince, kategori o türde değilse ilk uygun kategoriye geç.
  const pickKind = (k: Kind) => {
    setKind(k);
    const inKind = cats.filter((c) => c.kind === k);
    if (!inKind.some((c) => c.id === catId)) setCatId(inKind[0]?.id ?? "");
  };

  const valid = name.trim().length > 0 && !!catId && price >= 0 && !uploading;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosya tekrar seçilebilsin
    if (!file) return;
    setImgErr("");
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      const url = await uploadProductImage(dataUrl);
      if (url) setImg(url);
      else setImgErr("Yükleme başarısız");
    } catch {
      setImgErr("Görsel okunamadı");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="pop flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
            <ClipboardList className="h-5 w-5 text-brand" strokeWidth={2.2} />
            {product ? "Ürünü Düzenle" : "Yeni Ürün"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink3 transition hover:bg-surface2 hover:text-ink"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="scroll-light flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Fotoğraf — seç + önizleme (foto yoksa emoji/gradyan) */}
          <div className="flex items-center gap-3">
            <Food
              img={img}
              emoji={product?.emoji ?? DEFAULT_PRODUCT_EMOJI}
              grad={product?.grad ?? DEFAULT_PRODUCT_GRAD}
              className="h-16 w-16 shrink-0 rounded-xl"
            />
            <div className="min-w-0">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Fotoğraf</span>
              <div className="flex items-center gap-2">
                {/* <label> içindeki gizli input — tıklayınca dosya penceresi
                    NATIVE açılır (programatik .click() yok; tüm tarayıcılarda çalışır). */}
                <label
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line2 bg-white px-3 py-2 text-xs font-bold text-ink2 transition hover:bg-surface2 hover:text-ink",
                    uploading && "pointer-events-none opacity-50",
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
                  ) : (
                    <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                  )}
                  {uploading ? "Yükleniyor…" : img ? "Değiştir" : "Fotoğraf Seç"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
                {img && !uploading && (
                  <button
                    type="button"
                    onClick={() => setImg("")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line2 bg-white px-3 py-2 text-xs font-bold text-ink3 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                    Kaldır
                  </button>
                )}
              </div>
              {imgErr && <span className="mt-1 block text-[11px] font-semibold text-rose-600">{imgErr}</span>}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Ürün Adı</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Adana Kebap"
              className="h-11 w-full rounded-xl border border-line2 bg-surface2 px-3.5 text-sm font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-ink3 focus:border-brand/60 focus:bg-white"
            />
          </label>

          {/* Tür — önce yiyecek mi içecek mi (kategori ve hazırlık bundan gelir) */}
          <div>
            <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Tür</span>
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((k) => {
                const on = kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => pickKind(k.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-bold transition",
                      on
                        ? "border-brand bg-brand text-white shadow-sm shadow-brand/30"
                        : "border-line2 bg-surface2 text-ink2 hover:bg-white hover:text-ink",
                    )}
                  >
                    {k.label}
                    <span className={cn("ml-1.5 text-[11px] font-semibold", on ? "text-white/80" : "text-ink3")}>
                      · {k.route === "bar" ? "Bar" : "Mutfak"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Kategori</span>
              <select
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="h-11 w-full rounded-xl border border-line2 bg-surface2 px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand/60 focus:bg-white"
              >
                {catsOfKind.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Fiyat (₺)</span>
              <input
                type="number"
                step="1"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="h-11 w-full rounded-xl border border-line2 bg-surface2 px-3.5 text-sm font-semibold text-ink outline-none transition focus:border-brand/60 focus:bg-white"
              />
            </label>
          </div>

          {/* ---- Yönetmelik şeffaflık alanları (QR menüde gösterilir) ---- */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-amber-700 uppercase">
              <Tags className="h-3.5 w-3.5" strokeWidth={2.4} />
              Menü Bilgisi (Yönetmelik)
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Kalori (kcal)</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={kcal}
                  onChange={(e) => setKcal(parseInt(e.target.value) || 0)}
                  placeholder="Örn. 520"
                  className="h-11 w-full rounded-xl border border-line2 bg-white px-3.5 text-sm font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-ink3 focus:border-brand/60"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Et Türü</span>
                <select
                  value={meat}
                  onChange={(e) => setMeat(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line2 bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand/60"
                >
                  {MEATS.map((m) => (
                    <option key={m} value={m}>
                      {m === "Yok" ? "Et yok / etsiz" : m}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink2">
                Alerjenler <span className="font-normal text-ink3">(içerikte bulunanları seçin)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ALLERGENS.map((a) => {
                  const on = allergens.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAllergen(a)}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition ring-1",
                        on
                          ? "bg-rose-500 text-white ring-rose-500"
                          : "bg-white text-ink2 ring-line2 hover:bg-surface2",
                      )}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink2">İçerik / Açıklama</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder="Örn. Elde kıyılmış kuzu eti, kuyruk yağı, acı biber; közde pişirilir."
                className="w-full resize-none rounded-xl border border-line2 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-ink3 focus:border-brand/60"
              />
            </label>
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
            onClick={() =>
              valid &&
              onSave({
                name: name.trim(),
                cat: catId,
                price,
                route,
                img,
                kcal,
                allergens,
                meat,
                content: content.trim(),
              })
            }
            disabled={!valid}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" strokeWidth={2.6} />
            {product ? "Kaydet" : "Ürünü Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
