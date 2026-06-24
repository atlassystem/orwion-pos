/* POST /api/self/order — PUBLIC self-sipariş (QR menü).
   Body: { branch, no, items:[{pid,qty}] }. Yalnızca o şube+masanın adisyonuna
   KALEM EKLER (fiyat/iskonto/silme YOK). Ürünler route'una göre mutfak/bar'a düşer.
   Ödeme yok — personel POS'tan kapatır. Rate-limit'li. */
import { getDb, byTenant } from "@/lib/server/repo";
import type { OrderItem } from "@/lib/pos-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Basit IP rate-limit (tek süreç; standalone için yeterli) ---
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}

const MAX_QTY = 99;
const MAX_LINES = 50;

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const b = (await req.json().catch(() => ({}))) as {
      branch?: string;
      no?: string;
      items?: { pid?: string; qty?: number }[];
    };
    const branch = (b.branch ?? "").trim();
    const no = (b.no ?? "").trim();
    const incoming = Array.isArray(b.items) ? b.items.slice(0, MAX_LINES) : [];
    if (!branch || !no || incoming.length === 0) {
      return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
    }

    const db = await getDb();

    // Masa bu şubede var mı? (yanlış/eksik masa reddedilir)
    const table = await db.collection("tables").findOne(byTenant({ no, branch_id: branch }));
    if (!table) {
      return Response.json({ ok: false, error: "invalid_table" }, { status: 404 });
    }

    // Geçerli ürün kimlikleri (bilinmeyen pid yok sayılır).
    const products = await db
      .collection("products")
      .find(byTenant(), { projection: { _id: 0, id: 1 } })
      .toArray();
    const validIds = new Set(products.map((p) => p.id as string));

    // Mevcut adisyon kalemleriyle birleştir (yalnızca qty artışı/ekleme).
    const items: OrderItem[] = (table.items ?? []).map((i: OrderItem) => ({ ...i }));
    let added = 0;
    for (const it of incoming) {
      const pid = String(it.pid ?? "");
      let qty = Math.floor(Number(it.qty) || 0);
      if (!validIds.has(pid) || qty <= 0) continue;
      qty = Math.min(qty, MAX_QTY);
      const ex = items.find((x) => x.pid === pid);
      if (ex) ex.qty = Math.min(ex.qty + qty, 999);
      else items.push({ pid, qty });
      added += qty;
    }
    if (added === 0) {
      return Response.json({ ok: false, error: "no_valid_items" }, { status: 400 });
    }

    const status =
      table.status === "bos" || table.status === "rezerve" ? "dolu" : table.status;
    await db.collection("tables").updateOne(
      byTenant({ no, branch_id: branch }),
      {
        $set: {
          items,
          status,
          startedAt: table.startedAt ?? 0,
          waiter: table.waiter ?? "QR",
        },
      },
    );

    return Response.json({ ok: true, added });
  } catch (err) {
    console.error("[self order] hata:", err);
    return Response.json({ ok: false, error: "order_failed" }, { status: 500 });
  }
}
