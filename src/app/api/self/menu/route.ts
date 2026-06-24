/* GET /api/self/menu?branch= — PUBLIC (giriş gerekmez).
   Self-sipariş sayfası için: şubeler + (seçili şubenin) masaları + ORTAK katalog.
   Personel/şifre gibi hassas veri DÖNMEZ. */
import { getDb, byTenant, PUBLIC_PROJ, seedIfEmpty } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const db = await getDb();
    await seedIfEmpty(db);
    const branch = new URL(req.url).searchParams.get("branch") || "";

    const [branches, halls, categories, products] = await Promise.all([
      db.collection("branches").find(byTenant(), { projection: { _id: 0, id: 1, name: 1, city: 1 } }).toArray(),
      db.collection("halls").find(byTenant(), { projection: PUBLIC_PROJ }).toArray(),
      db.collection("categories").find(byTenant(), { projection: PUBLIC_PROJ }).toArray(),
      db.collection("products").find(byTenant(), { projection: PUBLIC_PROJ }).toArray(),
    ]);

    // Masalar yalnızca şube seçiliyse (no/hall/seats/status — minimal).
    const tables = branch
      ? await db
          .collection("tables")
          .find(byTenant({ branch_id: branch }), { projection: { _id: 0, no: 1, hall: 1, seats: 1, status: 1 } })
          .toArray()
      : [];

    return Response.json({ ok: true, branches, halls, categories, products, tables });
  } catch (err) {
    console.error("[self menu] hata:", err);
    return Response.json({ ok: false, error: "load_failed" }, { status: 500 });
  }
}
