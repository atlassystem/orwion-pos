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
  DEFAULT_PRODUCT_EMOJI,
  DEFAULT_PRODUCT_GRAD,
  type Product,
  type Category,
  type Route,
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
  const [cat, setCat] = useState("hepsi");
  // null = kapalı, "new" = ekleme, Product = düzenleme
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const list = products.filter((p) => (cat === "hepsi" ? true : p.cat === cat));
  const barCount = products.filter((p) => p.route === "bar").length;

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

      <div className="mb-4 flex flex-wrap items-center gap-2 px-7">
        <Tab on={cat === "hepsi"} onClick={() => setCat("hepsi")}>
          Tümü
        </Tab>
        {cats.map((c) => {
          const Ic = catIcon(c.id);
          return (
            <Tab key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
              <span className="inline-flex items-center gap-1.5">
                <Ic className="h-4 w-4" strokeWidth={2.1} />
                {c.name}
              </span>
            </Tab>
          );
        })}
      </div>

      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="pos-card overflow-hidden">
          <div className="grid grid-cols-[2.4fr_1.4fr_1fr_1fr_104px] gap-3 border-b border-line bg-surface2 px-5 py-3 text-[11px] font-bold tracking-wide text-ink3 uppercase">
            <span>Ürün</span>
            <span>Kategori</span>
            <span>Hazırlık</span>
            <span className="text-right">Fiyat</span>
            <span className="text-right">İşlem</span>
          </div>
          {list.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-ink3">
              Bu kategoride ürün yok.
            </div>
          )}
          {list.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[2.4fr_1.4fr_1fr_1fr_104px] items-center gap-3 border-b border-line px-5 py-3 last:border-0 hover:bg-surface2/60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Food img={p.img} emoji={p.emoji} grad={p.grad} className="h-10 w-10 shrink-0 rounded-lg" />
                <span className="truncate text-sm font-bold text-ink">{p.name}</span>
              </div>
              <span className="text-xs font-semibold text-ink2">
                {cats.find((c) => c.id === p.cat)?.name ?? p.cat}
              </span>
              <span
                className={cn(
                  "w-fit rounded-full px-2 py-0.5 text-[11px] font-bold",
                  p.route === "bar" ? "bg-sky-100 text-sky-700" : "bg-orange-100 text-orange-700",
                )}
              >
                {p.route === "bar" ? "Bar" : "Mutfak"}
              </span>
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
  const [name, setName] = useState(product?.name ?? "");
  const [catId, setCatId] = useState(product?.cat ?? cats[0]?.id ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [route, setRoute] = useState<Route>(product?.route ?? "mutfak");
  const [img, setImg] = useState(product?.img ?? "");
  const [uploading, setUploading] = useState(false);
  const [imgErr, setImgErr] = useState("");

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
      <div className="pop flex w-full max-w-md flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
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

        <div className="space-y-4 px-6 py-5">
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

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Kategori</span>
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="h-11 w-full rounded-xl border border-line2 bg-surface2 px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand/60 focus:bg-white"
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
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

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink2">Hazırlık</span>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as Route)}
                className="h-11 w-full rounded-xl border border-line2 bg-surface2 px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand/60 focus:bg-white"
              >
                <option value="mutfak">Mutfak</option>
                <option value="bar">Bar</option>
              </select>
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
              valid && onSave({ name: name.trim(), cat: catId, price, route, img })
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
