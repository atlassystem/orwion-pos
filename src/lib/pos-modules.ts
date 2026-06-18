/* ============================================================
   Orwion POS — Yönetim modülleri demo verisi
   (doyourorder referanslı: Envanter, İş Gücü, Sadakat, Rezervasyon)
   ============================================================ */

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

export const stockValue = (s: StockItem) => s.qty * s.cost;
export const isLow = (s: StockItem) => s.qty <= s.min;

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
}

export const STAFF: Staff[] = [
  { id: "u1", name: "Ahmet Yılmaz", role: "Garson", initials: "AY", state: "vardiyada", clockIn: "10:00", hoursToday: 6.5, salesToday: 8420, rating: 4.8 },
  { id: "u2", name: "Selin Kaya", role: "Garson", initials: "SK", state: "vardiyada", clockIn: "10:00", hoursToday: 6.5, salesToday: 9650, rating: 4.9 },
  { id: "u3", name: "Murat Demir", role: "Garson", initials: "MD", state: "molada", clockIn: "11:00", hoursToday: 5.5, salesToday: 6230, rating: 4.6 },
  { id: "u4", name: "Elif Şahin", role: "Kasiyer", initials: "EŞ", state: "vardiyada", clockIn: "09:00", hoursToday: 7.5, salesToday: 0, rating: 4.7 },
  { id: "u5", name: "Can Aydın", role: "Şef", initials: "CA", state: "vardiyada", clockIn: "08:30", hoursToday: 8, salesToday: 0, rating: 4.9 },
  { id: "u6", name: "Zeynep Arslan", role: "Komi", initials: "ZA", state: "cikis", clockIn: null, hoursToday: 0, salesToday: 0, rating: 4.4 },
  { id: "u7", name: "Burak Öz", role: "Mutfak", initials: "BÖ", state: "vardiyada", clockIn: "08:30", hoursToday: 8, salesToday: 0, rating: 4.5 },
  { id: "u8", name: "Deniz Yıldız", role: "Garson", initials: "DY", state: "cikis", clockIn: null, hoursToday: 0, salesToday: 0, rating: 4.3 },
];

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

/* ---------- Sıramatik: Gel-Al / Paket sıra biletleri ---------- */
export type QState = "hazirlaniyor" | "hazir" | "teslim";

export interface QTicket {
  id: string;
  no: number; // ekranda görünen sıra numarası
  channel: "Gel-Al" | "Paket" | "Online";
  name: string; // müşteri adı / etiket
  items: number; // ürün adedi
  state: QState;
  min: number; // kaç dk önce alındı
}

export const QUEUE: QTicket[] = [
  { id: "q1", no: 142, channel: "Gel-Al", name: "Mehmet B.", items: 3, state: "hazir", min: 11 },
  { id: "q2", no: 143, channel: "Paket", name: "Trendyol #5521", items: 5, state: "hazir", min: 9 },
  { id: "q3", no: 144, channel: "Gel-Al", name: "Ayşe K.", items: 2, state: "hazirlaniyor", min: 7 },
  { id: "q4", no: 145, channel: "Online", name: "Getir #8830", items: 4, state: "hazirlaniyor", min: 5 },
  { id: "q5", no: 146, channel: "Gel-Al", name: "Can T.", items: 1, state: "hazirlaniyor", min: 3 },
  { id: "q6", no: 147, channel: "Paket", name: "Yemeksepeti #441", items: 6, state: "hazirlaniyor", min: 1 },
];

export const QSTATE: Record<QState, { label: string; chip: string; dot: string }> = {
  hazirlaniyor: { label: "Hazırlanıyor", chip: "bg-amber-100 text-amber-700", dot: "#f59e0b" },
  hazir: { label: "Hazır", chip: "bg-emerald-100 text-emerald-700", dot: "#10b981" },
  teslim: { label: "Teslim edildi", chip: "bg-slate-100 text-slate-500", dot: "#94a3b8" },
};

/* ---------- Sıramatik: Masa bekleme listesi (waitlist) ---------- */
export type WState = "bekliyor" | "cagrildi" | "oturdu" | "iptal";

export interface WaitEntry {
  id: string;
  no: number; // bekleme sırası
  name: string;
  size: number; // kişi sayısı
  phone: string;
  min: number; // kaç dk bekliyor
  pref: string; // salon tercihi
  state: WState;
}

export const WAITLIST: WaitEntry[] = [
  { id: "w1", no: 7, name: "Yılmaz Ailesi", size: 4, phone: "0532 •• •• 14", min: 18, pref: "Bahçe", state: "cagrildi" },
  { id: "w2", no: 8, name: "Demir", size: 2, phone: "0541 •• •• 02", min: 12, pref: "Farketmez", state: "bekliyor" },
  { id: "w3", no: 9, name: "Kaya +1", size: 2, phone: "0505 •• •• 77", min: 9, pref: "İç Salon", state: "bekliyor" },
  { id: "w4", no: 10, name: "Şahin grubu", size: 6, phone: "0533 •• •• 51", min: 6, pref: "Teras", state: "bekliyor" },
  { id: "w5", no: 11, name: "Aydın", size: 3, phone: "0537 •• •• 39", min: 2, pref: "Farketmez", state: "bekliyor" },
];

export const WSTATE: Record<WState, { label: string; chip: string; dot: string }> = {
  bekliyor: { label: "Bekliyor", chip: "bg-sky-100 text-sky-700", dot: "#38bdf8" },
  cagrildi: { label: "Çağrıldı", chip: "bg-amber-100 text-amber-700", dot: "#f59e0b" },
  oturdu: { label: "Masaya alındı", chip: "bg-emerald-100 text-emerald-700", dot: "#10b981" },
  iptal: { label: "İptal", chip: "bg-slate-100 text-slate-500", dot: "#94a3b8" },
};
