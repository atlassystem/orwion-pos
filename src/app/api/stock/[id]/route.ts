/* PUT /api/stock/[id] — stok kalemini güncelle (stok girişi).
   Body: { qty } yeni mutlak miktar, veya { addQty } eklenecek miktar. */
import { getDb, byTenant, PUBLIC_PROJ } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      qty?: number;
      addQty?: number;
    };
    const db = await getDb();
    const coll = db.collection("stock");

    const current = await coll.findOne(byTenant({ id }));
    if (!current) {
      return Response.json({ ok: false, error: "stock_not_found" }, { status: 404 });
    }

    let nextQty =
      typeof body.qty === "number"
        ? body.qty
        : (current.qty ?? 0) + (body.addQty ?? 0);
    nextQty = Math.max(0, Math.round(nextQty * 1000) / 1000);

    await coll.updateOne(byTenant({ id }), { $set: { qty: nextQty } });
    const item = await coll.findOne(byTenant({ id }), { projection: PUBLIC_PROJ });

    return Response.json({ ok: true, item });
  } catch (err) {
    console.error("[stock PUT] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
