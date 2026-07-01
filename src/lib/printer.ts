/* ============================================================
   Orwion POS — Yazıcı köprüsü kancası (ÖKC deseni)
   Termal POS yazıcıları (mutfak + bar) için ESC/POS köprüsüne fiş gönderir.
   BAYRAK KAPALIYKEN hiçbir şey yapmaz (no-op) ve ASLA hata fırlatmaz →
   cihaz gelene kadar sipariş akışı hiç etkilenmez (regresyon yok).
   Cihaz gelince: yerel köprü ajanını çalıştır + NEXT_PUBLIC_PRINTER_AKTIF=1.
   ============================================================ */

/** Yazıcı köprüsü aktif mi? Varsayılan KAPALI (cihaz yok). */
export const PRINTER_AKTIF = process.env.NEXT_PUBLIC_PRINTER_AKTIF === "1";

/** Yerel köprü ajanı adresi (ESC/POS'a çeviren). Env ile değişebilir. */
const BRIDGE_URL = process.env.PRINTER_BRIDGE_URL || "http://127.0.0.1:9500/print";

/** Hangi yazıcı: mutfak fişi mi, misafir sıra kağıdı mı (bar). */
export type PrinterTarget = "mutfak" | "bar";

export interface PrintLine {
  name: string;
  qty: number;
}

export interface PrintJob {
  /** Hedef yazıcı (mutfak = mutfak yazıcısı, bar = bar/sıra kağıdı yazıcısı). */
  target: PrinterTarget;
  /** Fiş türü — köprü/şablon seçimi için. */
  kind: "mutfak_fisi" | "sira_kagidi";
  branch: string;
  masa: string;
  /** Sıra numarası (Sıramatik). */
  sira: number;
  /** Kalemler (sıra kağıdında boş olabilir). */
  lines: PrintLine[];
  /** Oluşturma zamanı (ISO). */
  at: string;
}

/**
 * Bir fişi köprüye gönderir. Bayrak kapalıysa no-op. Ağ/köprü hatası akışı
 * BOZMAZ (yalnız log). Bu yüzden çağrı yerlerinde `await` ŞART DEĞİL (void).
 */
export async function sendToPrinter(job: PrintJob): Promise<void> {
  if (!PRINTER_AKTIF) return; // cihaz yok → sessizce geç
  try {
    await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
      // Köprü yerelde; kısa timeout gibi davranması için no-store.
      cache: "no-store",
    });
  } catch (err) {
    console.warn("[printer] köprüye gönderilemedi (yok sayıldı):", err);
  }
}

/** Mutfak fişi işi (yalnızca mutfak kalemleri). */
export function buildKitchenTicket(
  branch: string,
  masa: string,
  sira: number,
  lines: PrintLine[],
): PrintJob {
  return { target: "mutfak", kind: "mutfak_fisi", branch, masa, sira, lines, at: new Date().toISOString() };
}

/** Misafir sıra kağıdı işi (bar yazıcısı; büyük sıra no + masa). */
export function buildGuestSlip(
  branch: string,
  masa: string,
  sira: number,
  lines: PrintLine[],
): PrintJob {
  return { target: "bar", kind: "sira_kagidi", branch, masa, sira, lines, at: new Date().toISOString() };
}
