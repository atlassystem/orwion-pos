/* /api/products/[id] — tek ürün düzenle/sil.
   PUT: gönderilen alanları güncelle. DELETE: ürünü (ve reçetesini) sil. */
import { getDb, byTenant, PUBLIC_PROJ } from "@/lib/server/repo";
import type { Product } from "@/lib/pos-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const b = (await req.json().catch(() => ({}))) as Partial<Product>;
    const db = await getDb();
    const coll = db.collection("products");

    const cur = await coll.findOne(byTenant({ id }));
    if (!cur) {
      return Response.json({ ok: false, error: "product_not_found" }, { status: 404 });
    }

    const set: Record<string, unknown> = {};
    if (b.name !== undefined) set.name = String(b.name).trim();
    if (b.cat !== undefined) set.cat = String(b.cat);
    if (b.price !== undefined) set.price = Number(b.price) || 0;
    if (b.route !== undefined) set.route = b.route === "bar" ? "bar" : "mutfak";
    if (b.emoji !== undefined) set.emoji = b.emoji;
    if (b.grad !== undefined) set.grad = b.grad;
    if (b.img !== undefined) set.img = b.img;
    if (b.code !== undefined) set.code = b.code ? String(b.code) : "";
    // Yönetmelik şeffaflık alanları.
    if (b.kcal !== undefined) set.kcal = Number(b.kcal) || 0;
    if (b.allergens !== undefined)
      set.allergens = Array.isArray(b.allergens) ? b.allergens.map(String) : [];
    if (b.meat !== undefined) set.meat = b.meat ? String(b.meat) : "Yok";
    if (b.content !== undefined) set.content = b.content ? String(b.content).trim() : "";
    // ÖKC / mali fiş: ürüne özel KDV oranı (yüzde). 0 → varsayılan oran kullanılır.
    if (b.kdv_orani !== undefined) set.kdv_orani = Number(b.kdv_orani) || 0;

    if (Object.keys(set).length) {
      await coll.updateOne(byTenant({ id }), { $set: set });
    }
    const product = await coll.findOne(byTenant({ id }), { projection: PUBLIC_PROJ });
    return Response.json({ ok: true, product });
  } catch (err) {
    console.error("[products PUT] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection("products").deleteOne(byTenant({ id }));
    // Sahipsiz reçete kalmasın: ürün silinince reçetesi de temizlenir.
    await db.collection("recipes").deleteOne(byTenant({ pid: id }));
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[products DELETE] hata:", err);
    return Response.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
}
