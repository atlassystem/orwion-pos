/* /api/tickets — Sıramatik fişleri (kalıcı: orwion_pos.tickets, restaurant_id).
   GET ?branch= : aktif fişler (hazırlanıyor + hazır), sıraya göre.
   POST : yeni fiş (kiosk/personel). Sıra no sunucuda ATOMİK atanır.
   Yeni fişte yazıcı köprüsü tetiklenir (bayrak kapalıysa no-op). */
import { getDb, RID, byTenant, PUBLIC_PROJ, DEFAULT_BRANCH, nextTicketNo } from "@/lib/server/repo";
import type { Ticket } from "@/lib/pos-modules";
import {
  sendToPrinter,
  buildKitchenTicket,
  buildGuestSlip,
  type PrintLine,
} from "@/lib/printer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QTY = 99;
const MAX_LINES = 50;

/** Kalem id+adetlerinden yazıcı satırları üretir (mutfak/bar ayrımıyla). */
async function buildPrintLines(
  db: Awaited<ReturnType<typeof getDb>>,
  items: { pid: string; qty: number }[],
): Promise<{ mutfak: PrintLine[]; bar: PrintLine[] }> {
  const ids = items.map((i) => i.pid);
  const prods = await db
    .collection("products")
    .find(byTenant({ id: { $in: ids } }), { projection: { _id: 0, id: 1, name: 1, route: 1 } })
    .toArray();
  const byId = new Map(prods.map((p) => [p.id as string, p]));
  const mutfak: PrintLine[] = [];
  const bar: PrintLine[] = [];
  for (const it of items) {
    const p = byId.get(it.pid);
    if (!p) continue;
    const line = { name: p.name as string, qty: it.qty };
    if (p.route === "bar") bar.push(line);
    else mutfak.push(line);
  }
  return { mutfak, bar };
}

export async function GET(req: Request) {
  try {
    const branch = new URL(req.url).searchParams.get("branch") || DEFAULT_BRANCH;
    const db = await getDb();
    const tickets = await db
      .collection("tickets")
      .find(byTenant({ branch_id: branch, state: { $ne: "teslim" } }), { projection: PUBLIC_PROJ })
      .sort({ createdAt: 1 })
      .toArray();
    return Response.json({ ok: true, tickets });
  } catch (err) {
    console.error("[tickets GET] hata:", err);
    return Response.json({ ok: false, error: "load_failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json().catch(() => ({}))) as {
      branch?: string;
      masa?: string;
      items?: { pid?: string; qty?: number }[];
    };
    const branch = (b.branch ?? "").trim() || DEFAULT_BRANCH;
    const masa = (b.masa ?? "").trim() || "—";
    const incoming = Array.isArray(b.items) ? b.items.slice(0, MAX_LINES) : [];
    const items = incoming
      .map((i) => ({ pid: String(i.pid ?? ""), qty: Math.min(Math.floor(Number(i.qty) || 0), MAX_QTY) }))
      .filter((i) => i.pid && i.qty > 0);
    if (items.length === 0) {
      return Response.json({ ok: false, error: "no_items" }, { status: 400 });
    }

    const db = await getDb();
    const no = await nextTicketNo(db);
    const doc: Ticket = {
      no,
      branch_id: branch,
      masa,
      items,
      state: "hazirlaniyor",
      createdAt: new Date().toISOString(),
      source: "kiosk",
    };
    await db.collection("tickets").insertOne({ ...doc, restaurant_id: RID });

    // Yazıcı köprüsü (bayrak kapalıysa no-op): mutfak fişi + misafir sıra kağıdı.
    const { mutfak, bar } = await buildPrintLines(db, items);
    void sendToPrinter(buildKitchenTicket(branch, masa, no, mutfak));
    void sendToPrinter(buildGuestSlip(branch, masa, no, [...mutfak, ...bar]));

    return Response.json({ ok: true, ticket: doc });
  } catch (err) {
    console.error("[tickets POST] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
