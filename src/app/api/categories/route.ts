/* /api/categories — menü kategorileri (kalıcı: orwion_pos.categories, restaurant_id).
   GET: sıraya göre listele. POST: yeni kategori ekle (id sunucuda üretilir). */
import { getDb, RID, byTenant, PUBLIC_PROJ } from "@/lib/server/repo";
import type { Category } from "@/lib/pos-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const categories = await db
      .collection("categories")
      .find(byTenant(), { projection: PUBLIC_PROJ })
      .sort({ order: 1 })
      .toArray();
    return Response.json({ ok: true, categories });
  } catch (err) {
    console.error("[categories GET] hata:", err);
    return Response.json({ ok: false, error: "load_failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json().catch(() => ({}))) as Partial<Category>;
    if (!b?.name) {
      return Response.json({ ok: false, error: "bad_body" }, { status: 400 });
    }
    const db = await getDb();
    const id =
      (b.id && String(b.id)) ||
      "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

    // Sıra verilmemişse listenin sonuna ekle.
    let order = Number(b.order);
    if (!Number.isFinite(order)) {
      const last = await db
        .collection("categories")
        .find(byTenant())
        .sort({ order: -1 })
        .limit(1)
        .toArray();
      order = ((last[0]?.order as number) ?? 0) + 1;
    }

    const doc: Category = {
      id,
      name: String(b.name).trim(),
      emoji: b.emoji ? String(b.emoji) : "🍽️",
      color: b.color ? String(b.color) : "#c0492f",
      kind: b.kind === "icecek" ? "icecek" : "yiyecek",
      order,
    };
    await db.collection("categories").insertOne({ ...doc, restaurant_id: RID });
    return Response.json({ ok: true, category: doc });
  } catch (err) {
    console.error("[categories POST] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
