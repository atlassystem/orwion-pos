/* /api/categories/[id] — PUT: güncelle (ad/sıra/renk/emoji/tür). DELETE: sil.
   Kullanımdaki kategori (ürünü olan) silinemez → yetim ürün oluşmaz. */
import { getDb, byTenant } from "@/lib/server/repo";
import type { Category } from "@/lib/pos-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const b = (await req.json().catch(() => ({}))) as Partial<Category>;
    const set: Record<string, unknown> = {};
    if (b.name != null) set.name = String(b.name).trim();
    if (b.emoji != null) set.emoji = String(b.emoji);
    if (b.color != null) set.color = String(b.color);
    if (b.kind === "yiyecek" || b.kind === "icecek") set.kind = b.kind;
    if (b.order != null && Number.isFinite(Number(b.order))) set.order = Number(b.order);
    if (Object.keys(set).length === 0) {
      return Response.json({ ok: false, error: "empty" }, { status: 400 });
    }
    const db = await getDb();
    await db.collection("categories").updateOne(byTenant({ id }), { $set: set });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[categories PUT] hata:", err);
    return Response.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    // O kategoride ürün varsa silmeyi engelle (yetim ürün olmasın).
    const used = await db
      .collection("products")
      .countDocuments(byTenant({ cat: id }), { limit: 1 });
    if (used > 0) {
      return Response.json({ ok: false, error: "category_in_use" }, { status: 409 });
    }
    const r = await db.collection("categories").deleteOne(byTenant({ id }));
    return Response.json({ ok: true, deleted: r.deletedCount });
  } catch (err) {
    console.error("[categories DELETE] hata:", err);
    return Response.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
}
