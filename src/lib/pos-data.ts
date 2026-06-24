/* ============================================================
   Orwion POS — demo veri & yardımcılar
   index.html birebir referans alınarak port edildi.

   SSR-güvenli zaman modeli:
   Mutlak timestamp (Date.now) yerine "dakika saati" (clockMin)
   kullanıyoruz. clockMin sunucuda ve ilk istemci render'ında 0;
   böylece hydration uyuşmazlığı olmaz. Bir masanın `startedAt`
   değeri, açıldığı andaki clockMin'dir (seed masalar için negatif:
   ör. 32 dk önce açıldıysa startedAt = -32). Geçen süre =
   clockMin - startedAt.
   ============================================================ */

export type TableStatus = "bos" | "dolu" | "hesap" | "rezerve";
export type Route = "mutfak" | "bar";

/** Ürün türü: yiyecek (mutfak) / içecek (bar). Kategoriyi ve route'u belirler. */
export type Kind = "yiyecek" | "icecek";

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** Tür — yiyecek mi içecek mi. Tür seçici, gruplama ve route bundan türetilir. */
  kind: Kind;
}

/** Tür seçenekleri (sıra önemli — UI bu sırayı kullanır). */
export const KINDS: { id: Kind; label: string; route: Route }[] = [
  { id: "yiyecek", label: "Yiyecek", route: "mutfak" },
  { id: "icecek", label: "İçecek", route: "bar" },
];

/** Türe göre hazırlık yeri (route). */
export const routeOfKind = (k: Kind): Route => (k === "icecek" ? "bar" : "mutfak");

export interface Product {
  id: string;
  cat: string;
  name: string;
  price: number;
  emoji: string;
  grad: string;
  img: string;
  route: Route;
  /** İleride Sedna ürün eşlemesi için opsiyonel kod alanı (şimdilik kullanılmaz). */
  code?: string;
}

export interface OrderItem {
  pid: string;
  qty: number;
}

export interface Table {
  no: string;
  hall: string;
  seats: number;
  status: TableStatus;
  items: OrderItem[];
  /** Açılış anındaki clockMin; boş/rezerve masada null. */
  startedAt: number | null;
  waiter: string | null;
  /** Hangi şubeye ait (operasyon şubeye göre ayrı). DB'den gelir. */
  branch_id?: string;
}

export interface Hall {
  id: string;
  name: string;
}

/* ---------- Para ---------- */
export const TL = (n: number) =>
  (n || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " ₺";
export const TLk = (n: number) => (n || 0).toLocaleString("tr-TR");

/* ---------- Görsel degradeleri ---------- */
const G = {
  kirmizi: "linear-gradient(135deg,#8a2b2b,#c0492f)",
  yesil: "linear-gradient(135deg,#3a7d44,#6fae4e)",
  amber: "linear-gradient(135deg,#c9742b,#e8a23c)",
  mor: "linear-gradient(135deg,#5b3d8a,#8a5fb0)",
  mavi: "linear-gradient(135deg,#2a6f97,#4fa3c7)",
  kahve: "linear-gradient(135deg,#5b3a29,#8a5a3c)",
};
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=260&q=70`;

/* ---------- Kategoriler (tür: yiyecek=mutfak / içecek=bar) ---------- */
export const CATS: Category[] = [
  // Yiyecekler (route: mutfak)
  { id: "baslangic", name: "Başlangıçlar", emoji: "🥗", color: "#3a7d44", kind: "yiyecek" },
  { id: "corba", name: "Çorbalar", emoji: "🍲", color: "#c9742b", kind: "yiyecek" },
  { id: "izgara", name: "Izgara & Et", emoji: "🥩", color: "#c0492f", kind: "yiyecek" },
  { id: "burgerler", name: "Burgerler", emoji: "🍔", color: "#b5642a", kind: "yiyecek" },
  { id: "pizza", name: "Pizza & Makarna", emoji: "🍕", color: "#d96b2a", kind: "yiyecek" },
  { id: "tatli", name: "Tatlılar", emoji: "🍰", color: "#8a5fb0", kind: "yiyecek" },
  // İçecekler (route: bar)
  { id: "alkollu", name: "Alkollü", emoji: "🍷", color: "#7a2e4a", kind: "icecek" },
  { id: "alkolsuz", name: "Alkolsüz", emoji: "🧃", color: "#2a6f97", kind: "icecek" },
  { id: "soft", name: "Soft İçecek", emoji: "🥤", color: "#2a8fa7", kind: "icecek" },
];

/* ---------- Ürünler ---------- */
export const PRODUCTS: Product[] = [
  { id: "p1", cat: "baslangic", name: "Mevsim Salata", price: 120, emoji: "🥗", grad: G.yesil, img: U("1512621776951-a57141f2eefd"), route: "mutfak" },
  { id: "p2", cat: "baslangic", name: "Humus Tabağı", price: 95, emoji: "🫓", grad: G.amber, img: U("1543339308-43e59d6b73a6"), route: "mutfak" },
  { id: "p3", cat: "baslangic", name: "Sigara Böreği", price: 110, emoji: "🥟", grad: G.amber, img: U("1625938145312-c98a0a3e1f3a"), route: "mutfak" },
  { id: "p4", cat: "baslangic", name: "Peynir Tabağı", price: 165, emoji: "🧀", grad: G.amber, img: U("1452195100486-9cc805987862"), route: "mutfak" },

  { id: "c1", cat: "corba", name: "Mercimek Çorbası", price: 75, emoji: "🍲", grad: G.amber, img: U("1604152135912-04a022e23696"), route: "mutfak" },
  { id: "c2", cat: "corba", name: "Ezogelin Çorbası", price: 75, emoji: "🍜", grad: G.kirmizi, img: U("1547592166-23ac45744acd"), route: "mutfak" },
  { id: "c3", cat: "corba", name: "Domates Çorbası", price: 70, emoji: "🥣", grad: G.kirmizi, img: U("1568712067-66a3eee4f30c"), route: "mutfak" },

  { id: "i1", cat: "izgara", name: "Adana Kebap", price: 280, emoji: "🍢", grad: G.kirmizi, img: U("1599487488170-d11ec9c172f0"), route: "mutfak" },
  { id: "i2", cat: "izgara", name: "Izgara Köfte", price: 240, emoji: "🍖", grad: G.kirmizi, img: U("1529692236671-f1f6cf9683ba"), route: "mutfak" },
  { id: "i3", cat: "izgara", name: "Tavuk Şiş", price: 215, emoji: "🍗", grad: G.amber, img: U("1532550907401-a500c9a57435"), route: "mutfak" },
  { id: "i4", cat: "izgara", name: "Kuzu Pirzola", price: 420, emoji: "🥩", grad: G.kirmizi, img: U("1546833999-b9f581a1996d"), route: "mutfak" },
  { id: "i5", cat: "izgara", name: "Karışık Izgara", price: 480, emoji: "🍽️", grad: G.kirmizi, img: U("1544025162-d76694265947"), route: "mutfak" },

  { id: "bg1", cat: "burgerler", name: "Klasik Burger", price: 210, emoji: "🍔", grad: G.amber, img: U("1568901346375-23c9450c58cd"), route: "mutfak" },
  { id: "bg2", cat: "burgerler", name: "Cheeseburger", price: 235, emoji: "🍔", grad: G.kirmizi, img: U("1550547660-d9450f859349"), route: "mutfak" },

  { id: "z1", cat: "pizza", name: "Margherita Pizza", price: 190, emoji: "🍕", grad: G.kirmizi, img: U("1513104890138-7c749659a591"), route: "mutfak" },
  { id: "z2", cat: "pizza", name: "Karışık Pizza", price: 230, emoji: "🍕", grad: G.kirmizi, img: U("1565299624946-b28f40a0ae38"), route: "mutfak" },
  { id: "z3", cat: "pizza", name: "Penne Arrabiata", price: 175, emoji: "🍝", grad: G.kirmizi, img: U("1551183053-bf91a1d81141"), route: "mutfak" },
  { id: "z4", cat: "pizza", name: "Spaghetti Bolonez", price: 185, emoji: "🍝", grad: G.amber, img: U("1612874742237-6526221588e3"), route: "mutfak" },

  { id: "t1", cat: "tatli", name: "Künefe", price: 140, emoji: "🍮", grad: G.amber, img: U("1593269058349-7d6b4dca9c5f"), route: "mutfak" },
  { id: "t2", cat: "tatli", name: "Sufle", price: 130, emoji: "🍫", grad: G.kahve, img: U("1606313564200-e75d5e30476c"), route: "mutfak" },
  { id: "t3", cat: "tatli", name: "Cheesecake", price: 135, emoji: "🍰", grad: G.mor, img: U("1578985545062-69928b1d9587"), route: "mutfak" },
  { id: "t4", cat: "tatli", name: "Baklava (porsiyon)", price: 155, emoji: "🥮", grad: G.amber, img: U("1519676867240-f03562e64548"), route: "mutfak" },

  { id: "d1", cat: "alkolsuz", name: "Ayran", price: 35, emoji: "🥛", grad: G.mavi, img: U("1550583724-b2692b85b150"), route: "bar" },
  { id: "d2", cat: "soft", name: "Kola", price: 50, emoji: "🥤", grad: G.kirmizi, img: U("1554866585-cd94860890b7"), route: "bar" },
  { id: "d3", cat: "soft", name: "Taze Limonata", price: 65, emoji: "🍋", grad: G.amber, img: U("1437418747212-8d9709afab22"), route: "bar" },
  { id: "d4", cat: "alkolsuz", name: "Türk Kahvesi", price: 60, emoji: "☕", grad: G.kahve, img: U("1509042239860-f550ce710b93"), route: "bar" },
  { id: "d5", cat: "alkolsuz", name: "Çay", price: 25, emoji: "🫖", grad: G.kirmizi, img: U("1571934811356-5cc061b6821f"), route: "bar" },
  { id: "d6", cat: "alkolsuz", name: "Şalgam", price: 40, emoji: "🧃", grad: G.mor, img: U("1600271886742-f049cd451bba"), route: "bar" },
];

export const prodById: Record<string, Product> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
);

/** Yeni ürün için varsayılan görsel (CRUD'da emoji/grad/img boş bırakılırsa). */
export const DEFAULT_PRODUCT_GRAD = G.amber;
export const DEFAULT_PRODUCT_EMOJI = "🍽️";

/**
 * Çalışma zamanı menü kaynağı (DB → modül).
 * Ürünler/kategoriler DB'den geldiğinde modül seviyesindeki
 * PRODUCTS / CATS / prodById dizilerini YERİNDE günceller; böylece bu
 * sabitleri doğrudan import eden tüm ekranlar (adisyon, masalar, garson,
 * mutfak, sıramatik, rapor) ek değişiklik gerektirmeden güncel veriyle
 * çalışır. Diziler aynı referansta kalır (yalnızca içerik değişir).
 */
export function hydrateMenu(products?: Product[], cats?: Category[]): void {
  if (products && products.length) {
    PRODUCTS.splice(0, PRODUCTS.length, ...products);
    for (const k of Object.keys(prodById)) delete prodById[k];
    for (const p of PRODUCTS) prodById[p.id] = p;
  }
  if (cats && cats.length) {
    CATS.splice(0, CATS.length, ...cats);
  }
}

/* ---------- Salonlar ---------- */
export const HALLS: Hall[] = [
  { id: "ic", name: "İç Salon" },
  { id: "bahce", name: "Bahçe" },
  { id: "teras", name: "Teras" },
];

/* ---------- Başlangıç masaları ---------- */
export function seedTables(): Table[] {
  const mk = (
    no: string,
    hall: string,
    seats: number,
    status: TableStatus,
    extra: Partial<Table> = {},
  ): Table => ({
    no,
    hall,
    seats,
    status,
    items: [],
    startedAt: null,
    waiter: null,
    ...extra,
  });
  return [
    mk("1", "ic", 2, "bos"),
    mk("2", "ic", 4, "dolu", { waiter: "Ahmet", startedAt: -32, items: [{ pid: "i1", qty: 2 }, { pid: "c1", qty: 2 }, { pid: "d1", qty: 2 }, { pid: "d3", qty: 1 }] }),
    mk("3", "ic", 4, "bos"),
    mk("4", "ic", 6, "hesap", { waiter: "Selin", startedAt: -78, items: [{ pid: "i5", qty: 1 }, { pid: "z1", qty: 1 }, { pid: "t1", qty: 2 }, { pid: "d2", qty: 3 }] }),
    mk("5", "ic", 2, "dolu", { waiter: "Ahmet", startedAt: -12, items: [{ pid: "c2", qty: 2 }, { pid: "d4", qty: 2 }] }),
    mk("6", "ic", 4, "rezerve"),
    mk("7", "ic", 4, "bos"),
    mk("8", "ic", 8, "dolu", { waiter: "Murat", startedAt: -54, items: [{ pid: "i2", qty: 4 }, { pid: "z3", qty: 2 }, { pid: "p1", qty: 2 }, { pid: "d3", qty: 4 }, { pid: "t3", qty: 2 }] }),
    mk("B1", "bahce", 4, "dolu", { waiter: "Selin", startedAt: -21, items: [{ pid: "z1", qty: 1 }, { pid: "z2", qty: 1 }, { pid: "d2", qty: 2 }] }),
    mk("B2", "bahce", 4, "bos"),
    mk("B3", "bahce", 6, "bos"),
    mk("B4", "bahce", 2, "hesap", { waiter: "Murat", startedAt: -95, items: [{ pid: "i4", qty: 2 }, { pid: "t4", qty: 1 }, { pid: "d6", qty: 2 }] }),
    mk("B5", "bahce", 4, "bos"),
    mk("B6", "bahce", 8, "rezerve"),
    mk("T1", "teras", 2, "dolu", { waiter: "Ahmet", startedAt: -8, items: [{ pid: "d4", qty: 2 }, { pid: "t2", qty: 1 }] }),
    mk("T2", "teras", 4, "bos"),
    mk("T3", "teras", 4, "bos"),
    mk("T4", "teras", 6, "bos"),
  ];
}

/* ---------- Hesap yardımcıları ---------- */
export const KDV_ORAN = 0.1;
export const lineTotal = (it: OrderItem) =>
  (prodById[it.pid]?.price || 0) * it.qty;
export const orderTotal = (items: OrderItem[]) =>
  items.reduce((s, it) => s + lineTotal(it), 0);
export const itemCount = (items: OrderItem[]) =>
  items.reduce((a, i) => a + i.qty, 0);

/** Geçen süreyi "32 dk" / "1 sa 18 dk" biçiminde döndürür. */
export function elapsed(startedAt: number | null, clockMin: number): string {
  if (startedAt == null) return "";
  const m = Math.max(0, Math.round(clockMin - startedAt));
  if (m < 60) return m + " dk";
  return Math.floor(m / 60) + " sa " + (m % 60) + " dk";
}

/** Mutfak kolonu için ham dakika. */
export function minutesSince(
  startedAt: number | null,
  clockMin: number,
): number {
  if (startedAt == null) return 0;
  return Math.max(0, Math.round(clockMin - startedAt));
}

/* ---------- Durum stilleri (beyaz kart üstü) ---------- */
export const STATUS: Record<
  TableStatus,
  { label: string; dot: string; ring: string; soft: string; chip: string }
> = {
  bos: {
    label: "Boş",
    dot: "#94a3b8",
    ring: "border-slate-200",
    soft: "bg-slate-50",
    chip: "bg-slate-100 text-slate-500",
  },
  dolu: {
    label: "Dolu",
    dot: "#10b981",
    ring: "border-emerald-300",
    soft: "bg-emerald-50",
    chip: "bg-emerald-100 text-emerald-700",
  },
  hesap: {
    label: "Hesap İstendi",
    dot: "#f59e0b",
    ring: "border-amber-300",
    soft: "bg-amber-50",
    chip: "bg-amber-100 text-amber-700",
  },
  rezerve: {
    label: "Rezerve",
    dot: "#8b5cf6",
    ring: "border-violet-300",
    soft: "bg-violet-50",
    chip: "bg-violet-100 text-violet-700",
  },
};
