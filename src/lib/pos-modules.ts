/* ============================================================
   Orwion POS — Yönetim modülleri demo verisi
   (doyourorder referanslı: Envanter, İş Gücü, Sadakat, Rezervasyon)
   ============================================================ */

import type { OrderItem } from "./pos-data";

/* ---------- Envanter / Stok ---------- */
export interface StockItem {
  id: string;
  name: string;
  cat: string;
  unit: string;
  qty: number;
  min: number;
  cost: number; // birim maliyet (₺)
  supplier: string;
}

export const STOCK: StockItem[] = [
  { id: "s1", name: "Dana Kıyma", cat: "Et & Tavuk", unit: "kg", qty: 12.4, min: 15, cost: 320, supplier: "Anadolu Et" },
  { id: "s2", name: "Tavuk Göğüs", cat: "Et & Tavuk", unit: "kg", qty: 28, min: 12, cost: 145, supplier: "Anadolu Et" },
  { id: "s3", name: "Kuzu Pirzola", cat: "Et & Tavuk", unit: "kg", qty: 6.2, min: 8, cost: 540, supplier: "Anadolu Et" },
  { id: "s4", name: "Mozzarella", cat: "Süt Ürünleri", unit: "kg", qty: 9.5, min: 6, cost: 210, supplier: "Ege Süt" },
  { id: "s5", name: "Beyaz Peynir", cat: "Süt Ürünleri", unit: "kg", qty: 4.1, min: 5, cost: 180, supplier: "Ege Süt" },
  { id: "s6", name: "Domates", cat: "Sebze & Meyve", unit: "kg", qty: 22, min: 10, cost: 28, supplier: "Hal Sebze" },
  { id: "s7", name: "Soğan", cat: "Sebze & Meyve", unit: "kg", qty: 35, min: 10, cost: 16, supplier: "Hal Sebze" },
  { id: "s8", name: "Marul", cat: "Sebze & Meyve", unit: "adet", qty: 14, min: 20, cost: 12, supplier: "Hal Sebze" },
  { id: "s9", name: "Un", cat: "Kuru Gıda", unit: "kg", qty: 48, min: 25, cost: 22, supplier: "Toptan Gıda" },
  { id: "s10", name: "Pirinç", cat: "Kuru Gıda", unit: "kg", qty: 31, min: 15, cost: 54, supplier: "Toptan Gıda" },
  { id: "s11", name: "Zeytinyağı", cat: "Kuru Gıda", unit: "lt", qty: 18, min: 12, cost: 285, supplier: "Toptan Gıda" },
  { id: "s12", name: "Kola (kasa)", cat: "İçecek", unit: "kasa", qty: 9, min: 10, cost: 240, supplier: "İçecek Dağıtım" },
  { id: "s13", name: "Ayran (koli)", cat: "İçecek", unit: "koli", qty: 7, min: 8, cost: 160, supplier: "Ege Süt" },
  { id: "s14", name: "Çay (kg)", cat: "İçecek", unit: "kg", qty: 5.5, min: 4, cost: 320, supplier: "Toptan Gıda" },
];

export const STOCK_CATS = [
  "Et & Tavuk",
  "Süt Ürünleri",
  "Sebze & Meyve",
  "Kuru Gıda",
  "İçecek",
];

export const stockById: Record<string, StockItem> = Object.fromEntries(
  STOCK.map((s) => [s.id, s]),
);

export const stockValue = (s: StockItem) => s.qty * s.cost;
export const isLow = (s: StockItem) => s.qty <= s.min;

/* ---------- Reçeteler (menü ürünü → stok malzemeleri) ---------- */
export interface RecipeLine {
  stockId: string;
  qty: number; // stok biriminde tüketilen miktar (örn. 0.25 kg)
}

/** Ürün id → malzeme satırları. Tanımsız ürünlerin reçetesi yoktur. */
export const RECIPES: Record<string, RecipeLine[]> = {
  // Başlangıç & Çorba
  p1: [{ stockId: "s8", qty: 0.3 }, { stockId: "s6", qty: 0.1 }, { stockId: "s11", qty: 0.02 }],
  p4: [{ stockId: "s5", qty: 0.15 }, { stockId: "s4", qty: 0.05 }],
  c1: [{ stockId: "s7", qty: 0.03 }, { stockId: "s9", qty: 0.02 }, { stockId: "s11", qty: 0.01 }],
  c2: [{ stockId: "s10", qty: 0.03 }, { stockId: "s7", qty: 0.03 }],
  c3: [{ stockId: "s6", qty: 0.2 }, { stockId: "s9", qty: 0.02 }],
  // Izgara
  i1: [{ stockId: "s1", qty: 0.25 }, { stockId: "s7", qty: 0.05 }, { stockId: "s11", qty: 0.02 }],
  i2: [{ stockId: "s1", qty: 0.2 }, { stockId: "s7", qty: 0.05 }],
  i3: [{ stockId: "s2", qty: 0.25 }, { stockId: "s11", qty: 0.02 }],
  i4: [{ stockId: "s3", qty: 0.3 }],
  i5: [{ stockId: "s1", qty: 0.15 }, { stockId: "s2", qty: 0.12 }, { stockId: "s3", qty: 0.12 }],
  // Pizza & Makarna
  z1: [{ stockId: "s9", qty: 0.25 }, { stockId: "s4", qty: 0.15 }, { stockId: "s6", qty: 0.1 }],
  z2: [{ stockId: "s9", qty: 0.25 }, { stockId: "s4", qty: 0.15 }, { stockId: "s6", qty: 0.1 }, { stockId: "s1", qty: 0.08 }],
  z3: [{ stockId: "s9", qty: 0.2 }, { stockId: "s6", qty: 0.15 }, { stockId: "s11", qty: 0.02 }],
  z4: [{ stockId: "s9", qty: 0.2 }, { stockId: "s1", qty: 0.12 }, { stockId: "s6", qty: 0.12 }],
  // İçecek (paket/kasa)
  d1: [{ stockId: "s13", qty: 0.05 }],
  d2: [{ stockId: "s12", qty: 0.04 }],
  d5: [{ stockId: "s14", qty: 0.004 }],
};

/** Reçetenin malzeme maliyeti toplamı (₺). */
export const recipeCost = (lines: RecipeLine[]): number =>
  lines.reduce((s, l) => s + (stockById[l.stockId]?.cost ?? 0) * l.qty, 0);

/**
 * Sipariş kalemlerini reçeteye göre stoktan düşer; yeni stok dizisi döndürür.
 * Reçetesi olmayan ürünler stok tüketmez.
 */
export const consumeStock = (
  stock: StockItem[],
  items: OrderItem[],
  recipes: Record<string, RecipeLine[]>,
): StockItem[] => {
  const deduct: Record<string, number> = {};
  for (const it of items) {
    const lines = recipes[it.pid];
    if (!lines) continue;
    for (const l of lines) {
      deduct[l.stockId] = (deduct[l.stockId] ?? 0) + l.qty * it.qty;
    }
  }
  return stock.map((s) =>
    deduct[s.id]
      ? { ...s, qty: Math.max(0, Math.round((s.qty - deduct[s.id]) * 1000) / 1000) }
      : s,
  );
};

/**
 * Mevcut stokla bu reçeteden kaç porsiyon yapılabilir (limit malzemeye göre).
 * Reçete boşsa Infinity döner.
 */
export const portionsPossible = (lines: RecipeLine[], stock: StockItem[]): number => {
  if (!lines.length) return Infinity;
  const byId: Record<string, StockItem> = Object.fromEntries(stock.map((s) => [s.id, s]));
  const counts = lines
    .filter((l) => l.qty > 0)
    .map((l) => {
      const s = byId[l.stockId];
      return s ? Math.floor(s.qty / l.qty) : 0;
    });
  return counts.length ? Math.min(...counts) : Infinity;
};

/* ---------- Yetkilendirme (RBAC) ---------- */
/** Sidebar modül kimlikleri — sidebar View ile birebir aynı. */
export type ModuleId =
  | "masalar"
  | "garson"
  | "mutfak"
  | "siramatik"
  | "menu"
  | "stok"
  | "personel"
  | "rapor"
  | "subeler"
  | "ayarlar";

export const MODULES: { id: ModuleId; label: string }[] = [
  { id: "masalar", label: "Masa Planı" },
  { id: "garson", label: "Garson" },
  { id: "mutfak", label: "Mutfak (KDS)" },
  { id: "siramatik", label: "Sıramatik" },
  { id: "menu", label: "Menü Yönetimi" },
  { id: "stok", label: "Stok & Envanter" },
  { id: "personel", label: "Personel" },
  { id: "rapor", label: "Raporlar" },
  { id: "subeler", label: "Şubeler" },
  { id: "ayarlar", label: "Ayarlar" },
];

export const ALL_MODULES: ModuleId[] = MODULES.map((m) => m.id);

/**
 * Yetki seviyeleri:
 * - admin: her yere erişir ve düzenler
 * - yonetici: her yeri görür ama düzenleyemez (salt-okunur)
 * - personel: yalnızca atanan modülleri görür ve düzenler
 */
export type AccessLevel = "admin" | "yonetici" | "personel";

export const LEVELS: Record<
  AccessLevel,
  { label: string; desc: string; canEdit: boolean; scoped: boolean; chip: string }
> = {
  admin: {
    label: "Admin",
    desc: "Tüm alanlara erişir ve düzenler",
    canEdit: true,
    scoped: false,
    chip: "bg-brand-soft text-brand",
  },
  yonetici: {
    label: "Yönetici",
    desc: "Her yeri görür, düzenleyemez (salt-okunur)",
    canEdit: false,
    scoped: false,
    chip: "bg-sky-100 text-sky-700",
  },
  personel: {
    label: "Personel",
    desc: "Yalnızca atanan alanları görür ve düzenler",
    canEdit: true,
    scoped: true,
    chip: "bg-slate-100 text-slate-600",
  },
};

/* ---------- Personel / İş Gücü ---------- */
export type ShiftState = "vardiyada" | "molada" | "cikis";

export interface Staff {
  id: string;
  name: string;
  role: string;
  initials: string;
  state: ShiftState;
  clockIn: string | null; // "09:00"
  hoursToday: number;
  salesToday: number; // bugün getirdiği ciro (₺)
  rating: number; // 0-5
  level: AccessLevel;
  /** Sadece "personel" seviyesinde anlamlı; admin/yönetici tüm modülleri görür. */
  access: ModuleId[];
}

export const STAFF: Staff[] = [
  { id: "u1", name: "Ahmet Yılmaz", role: "Garson", initials: "AY", state: "vardiyada", clockIn: "10:00", hoursToday: 6.5, salesToday: 8420, rating: 4.8, level: "personel", access: ["masalar", "garson", "siramatik"] },
  { id: "u2", name: "Selin Kaya", role: "Garson", initials: "SK", state: "vardiyada", clockIn: "10:00", hoursToday: 6.5, salesToday: 9650, rating: 4.9, level: "personel", access: ["masalar", "garson", "siramatik"] },
  { id: "u3", name: "Murat Demir", role: "Garson", initials: "MD", state: "molada", clockIn: "11:00", hoursToday: 5.5, salesToday: 6230, rating: 4.6, level: "personel", access: ["masalar", "garson"] },
  { id: "u4", name: "Elif Şahin", role: "Kasiyer / Yönetici", initials: "EŞ", state: "vardiyada", clockIn: "09:00", hoursToday: 7.5, salesToday: 0, rating: 4.7, level: "yonetici", access: ALL_MODULES },
  { id: "u5", name: "Can Aydın", role: "İşletme Müdürü", initials: "CA", state: "vardiyada", clockIn: "08:30", hoursToday: 8, salesToday: 0, rating: 4.9, level: "admin", access: ALL_MODULES },
  { id: "u6", name: "Zeynep Arslan", role: "Sıramatik Personeli", initials: "ZA", state: "vardiyada", clockIn: "09:30", hoursToday: 5, salesToday: 0, rating: 4.4, level: "personel", access: ["siramatik"] },
  { id: "u7", name: "Burak Öz", role: "Mutfak", initials: "BÖ", state: "vardiyada", clockIn: "08:30", hoursToday: 8, salesToday: 0, rating: 4.5, level: "personel", access: ["mutfak", "siramatik"] },
  { id: "u8", name: "Deniz Yıldız", role: "Garson", initials: "DY", state: "cikis", clockIn: null, hoursToday: 0, salesToday: 0, rating: 4.3, level: "personel", access: ["masalar", "garson"] },
];

/** Kullanıcının erişebildiği modüller. */
export const userModules = (s: Staff): ModuleId[] =>
  LEVELS[s.level].scoped ? s.access : ALL_MODULES;

/** Kullanıcı düzenleme yapabilir mi? (yönetici salt-okunur) */
export const userCanEdit = (s: Staff): boolean => LEVELS[s.level].canEdit;

export const SHIFT: Record<ShiftState, { label: string; dot: string; chip: string }> = {
  vardiyada: { label: "Vardiyada", dot: "#10b981", chip: "bg-emerald-100 text-emerald-700" },
  molada: { label: "Molada", dot: "#f59e0b", chip: "bg-amber-100 text-amber-700" },
  cikis: { label: "Çıkış yaptı", dot: "#94a3b8", chip: "bg-slate-100 text-slate-500" },
};

/* ---------- Şubeler (çoklu konum) ---------- */
export interface Branch {
  id: string;
  name: string;
  city: string;
  active: boolean;
  todaySales: number;
  tables: number;
}

export const BRANCHES: Branch[] = [
  { id: "b1", name: "Merkez Şube", city: "İstanbul / Kadıköy", active: true, todaySales: 38420, tables: 17 },
  { id: "b2", name: "Sahil Şube", city: "İstanbul / Bostancı", active: true, todaySales: 29150, tables: 22 },
  { id: "b3", name: "AVM Şube", city: "İstanbul / Ataşehir", active: false, todaySales: 0, tables: 14 },
];

/* ---------- Yapılacaklar / Yakında modülleri ---------- */
export interface ModuleCard {
  key: string;
  title: string;
  desc: string;
  soon?: boolean;
}

export const COMING_MODULES: ModuleCard[] = [
  { key: "loyalty", title: "Sadakat Programı", desc: "Puan biriktirme, üye kartı ve otomatik kampanyalar.", soon: true },
  { key: "reservation", title: "Masa Rezervasyonu", desc: "Online rezervasyon takvimi ve masa tahsisi.", soon: true },
  { key: "qr", title: "QR Menü & Self-Sipariş", desc: "Masadan karekod ile sipariş ve ödeme.", soon: false },
  { key: "delivery", title: "Paket & Kurye", desc: "Gel-al ve teslimat siparişi yönetimi.", soon: false },
];

/* ============================================================
   Sıramatik — Her şey dahil otel SNACK BAR akışı
   Misafir kiosk'tan sipariş verir → fiş mutfağa + bara düşer →
   misafire sıra numarası verilir → hazır olunca çağrı ekranında yanar.
   Ödeme yok (her şey dahil); misafir oda numarasıyla tanımlanır.
   ============================================================ */
/** Hazırlık istasyonu — Menü ürünlerinin route'u (mutfak/bar) ile birebir. */
export type Station = "mutfak" | "bar";

export const STATION_META: Record<Station, { label: string; emoji: string; chip: string }> = {
  mutfak: { label: "Mutfak", emoji: "🍳", chip: "bg-orange-100 text-orange-700" },
  bar: { label: "Bar", emoji: "🍹", chip: "bg-sky-100 text-sky-700" },
};

/** Sıramatik fiş durumu. */
export type SnackState = "hazirlaniyor" | "hazir" | "teslim";
