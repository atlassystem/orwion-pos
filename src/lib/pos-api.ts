/* ============================================================
   Orwion POS — istemci API yardımcıları (kalıcı veri)
   Bileşenler bellek state yerine bunlarla okur/yazar.
   ============================================================ */
"use client";

import type { Table, Product, Category } from "./pos-data";
import type { StockItem, RecipeLine, Staff, Branch } from "./pos-modules";
import type { SednaProduct, SednaCostMap } from "./sedna";

export interface Bootstrap {
  tables: Table[];
  products: Product[];
  categories: Category[];
  stock: StockItem[];
  recipes: Record<string, RecipeLine[]>;
  staff: Staff[];
  branches: Branch[];
  /** Reçetelerde geçen Sedna kodlarının güncel birim maliyeti (canlı). */
  sednaCosts: SednaCostMap;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** Tüm POS durumunu DB'den çeker (gerekirse seed eder). Masalar AKTİF ŞUBEYE
 *  göre filtrelenir; katalog (ürün/kategori/reçete/stok) ortaktır. */
export async function fetchBootstrap(branch?: string): Promise<Bootstrap> {
  const qs = branch ? `?branch=${encodeURIComponent(branch)}` : "";
  const res = await fetch(`/api/bootstrap${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("bootstrap_failed");
  const d = await res.json();
  return {
    tables: d.tables,
    products: d.products,
    categories: d.categories,
    stock: d.stock,
    recipes: d.recipes,
    staff: d.staff,
    branches: d.branches,
    sednaCosts: d.sednaCosts ?? {},
  };
}

/* ---------- Raporlar ---------- */
export interface ReportSummary {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  orderCount: number;
}

/** Bir şube + gün için gerçek satış özeti (order'lardan). */
export async function fetchReportSummary(
  date: string,
  branch: string,
): Promise<ReportSummary> {
  const qs = `?date=${encodeURIComponent(date)}&branch=${encodeURIComponent(branch)}`;
  const res = await fetch(`/api/report/summary${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("report_failed");
  const d = await res.json();
  return {
    revenue: d.revenue ?? 0,
    cost: d.cost ?? 0,
    profit: d.profit ?? 0,
    margin: d.margin ?? 0,
    orderCount: d.orderCount ?? 0,
  };
}

/* ---------- Sedna maliyet kataloğu (reçete malzeme araması) ---------- */
/** code/ad ile Sedna ürünü arar (reçete malzemesi seçimi için). */
export async function searchSedna(q: string): Promise<SednaProduct[]> {
  const res = await fetch(`/api/sedna/products?q=${encodeURIComponent(q)}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const d = await res.json();
  return Array.isArray(d.products) ? d.products : [];
}

/* ---------- Ürün CRUD (Menü Yönetimi) ---------- */
type ProductInput = Partial<Omit<Product, "id">> & { name: string; cat: string };

/** Yeni ürün ekler; sunucudan id'li tam ürünü döndürür. */
export async function createProduct(input: ProductInput): Promise<Product | null> {
  const res = await fetch("/api/products", json("POST", input));
  if (!res.ok) return null;
  const d = await res.json();
  return d.product ?? null;
}

/** Ürünü düzenler; güncel ürünü döndürür. */
export async function updateProduct(
  id: string,
  patch: Partial<Product>,
): Promise<Product | null> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, json("PUT", patch));
  if (!res.ok) return null;
  const d = await res.json();
  return d.product ?? null;
}

/** Ürünü siler (reçetesi de sunucuda temizlenir). */
export async function deleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, json("DELETE"));
  return res.ok;
}

/** Ürün fotoğrafını (küçültülmüş dataURL) sunucuya yükler; kalıcı URL döner. */
export async function uploadProductImage(dataUrl: string): Promise<string | null> {
  const res = await fetch("/api/upload", json("POST", { dataUrl }));
  if (!res.ok) return null;
  const d = await res.json();
  return d.url ?? null;
}

/** Bir masanın tüm durumunu kaydeder (ürün ekle/çıkar, hesap iste). branch_id
 *  masa nesnesinde taşınır; ayrıca güvence için query'ye de eklenir. */
export async function saveTable(table: Table): Promise<void> {
  const qs = table.branch_id ? `?branch=${encodeURIComponent(table.branch_id)}` : "";
  await fetch(`/api/tables/${encodeURIComponent(table.no)}${qs}`, json("PUT", table));
}

/** Ödeme alır: order+payment kaydı (branch_id ile), stok düşümü; sıfırlanmış masa + güncel stok döner. */
export async function payTableApi(
  no: string,
  method = "nakit",
  branch?: string,
): Promise<{ table: Table | null; stock: StockItem[] | null }> {
  const qs = branch ? `?branch=${encodeURIComponent(branch)}` : "";
  const res = await fetch(
    `/api/tables/${encodeURIComponent(no)}/pay${qs}`,
    json("POST", { method }),
  );
  if (!res.ok) return { table: null, stock: null };
  const d = await res.json();
  return { table: d.table ?? null, stock: d.stock ?? null };
}

/** Reçete haritasını DB ile eşitler. */
export async function saveRecipes(map: Record<string, RecipeLine[]>): Promise<void> {
  await fetch("/api/recipes", json("PUT", map));
}

/** Personel listesini DB ile eşitler. */
export async function saveStaff(list: Staff[]): Promise<void> {
  await fetch("/api/staff", json("PUT", list));
}

/** Stok kalemini yeni mutlak miktara günceller. */
export async function saveStockQty(id: string, qty: number): Promise<StockItem | null> {
  const res = await fetch(`/api/stock/${encodeURIComponent(id)}`, json("PUT", { qty }));
  if (!res.ok) return null;
  const d = await res.json();
  return d.item ?? null;
}
