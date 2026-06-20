/* /api/staff — personel listesi.
   GET: listele. PUT: tam listeyi DB ile eşitle (ekle/güncelle/sil). */
import { getDb, RID, byTenant, PUBLIC_PROJ } from "@/lib/server/repo";
import type { Staff } from "@/lib/pos-modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const staff = await db
      .collection("personnel")
      .find(byTenant(), { projection: PUBLIC_PROJ })
      .toArray();
    return Response.json({ ok: true, staff });
  } catch (err) {
    console.error("[staff GET] hata:", err);
    return Response.json({ ok: false, error: "load_failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const list = (await req.json()) as Staff[];
    if (!Array.isArray(list)) {
      return Response.json({ ok: false, error: "bad_body" }, { status: 400 });
    }
    const db = await getDb();
    const coll = db.collection("personnel");

    const ids = list.map((s) => s.id);
    const ops = list.map((s) => ({
      updateOne: {
        filter: byTenant({ id: s.id }),
        update: { $set: { ...s, restaurant_id: RID } },
        upsert: true,
      },
    }));
    if (ops.length) await coll.bulkWrite(ops);
    await coll.deleteMany(byTenant({ id: { $nin: ids } }));

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[staff PUT] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
