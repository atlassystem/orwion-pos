/* PUT /api/recipes — reçete haritasını (Record<pid, lines>) DB ile eşitle.
   Boş satırlı/eksik pid'ler silinir. */
import { getDb, RID, byTenant } from "@/lib/server/repo";
import type { RecipeLine } from "@/lib/pos-modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const map = (await req.json()) as Record<string, RecipeLine[]>;
    const db = await getDb();
    const coll = db.collection("recipes");

    const keep = Object.entries(map).filter(([, lines]) => lines && lines.length);
    const keepPids = keep.map(([pid]) => pid);

    const ops = keep.map(([pid, lines]) => ({
      updateOne: {
        filter: byTenant({ pid }),
        update: { $set: { restaurant_id: RID, pid, lines } },
        upsert: true,
      },
    }));
    if (ops.length) await coll.bulkWrite(ops);

    // Artık tanımlı olmayan reçeteleri sil.
    await coll.deleteMany(byTenant({ pid: { $nin: keepPids } }));

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[recipes PUT] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
