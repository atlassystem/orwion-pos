/* POST /api/tables/[no]/pay — ödeme al:
   order + payment kaydı oluştur, reçeteye göre stok düş, masayı sıfırla.
   Döner: { table (sıfırlanmış), stock (güncel liste) }. */
import {
  getDb,
  RID,
  byTenant,
  PUBLIC_PROJ,
  recipeDocsToMap,
  consumeStockInDb,
} from "@/lib/server/repo";
import { KDV_ORAN, type OrderItem } from "@/lib/pos-data";
import type { RecipeLine } from "@/lib/pos-modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ no: string }> },
) {
  try {
    const { no } = await params;
    const method = await req
      .json()
      .then((b) => (b?.method as string) || "nakit")
      .catch(() => "nakit");

    const db = await getDb();
    const table = await db.collection("tables").findOne(byTenant({ no }));
    if (!table) {
      return Response.json({ ok: false, error: "table_not_found" }, { status: 404 });
    }

    const items = (table.items ?? []) as OrderItem[];

    if (items.length) {
      // Fiyatları üründen al → sipariş satırlarını fiyatla dondur.
      const products = await db
        .collection("products")
        .find(byTenant(), { projection: { _id: 0, id: 1, name: 1, price: 1 } })
        .toArray();
      const priceById = new Map(products.map((p) => [p.id, p]));

      const lines = items.map((it) => {
        const p = priceById.get(it.pid);
        return {
          pid: it.pid,
          name: p?.name ?? it.pid,
          qty: it.qty,
          price: p?.price ?? 0,
          lineTotal: (p?.price ?? 0) * it.qty,
        };
      });
      const total = lines.reduce((s, l) => s + l.lineTotal, 0);
      const kdv = Math.round((total - total / (1 + KDV_ORAN)) * 100) / 100;
      const paidAt = new Date();

      const orderDoc = {
        restaurant_id: RID,
        tableNo: no,
        hall: table.hall,
        waiter: table.waiter ?? null,
        items: lines,
        subtotal: Math.round((total - kdv) * 100) / 100,
        kdv,
        total,
        method,
        paidAt,
      };
      const { insertedId } = await db.collection("orders").insertOne(orderDoc);

      await db.collection("payments").insertOne({
        restaurant_id: RID,
        orderId: insertedId,
        tableNo: no,
        amount: total,
        method,
        paidAt,
      });

      // Stok düşümü (reçeteye göre).
      const recipeDocs = await db
        .collection("recipes")
        .find(byTenant(), { projection: { _id: 0, restaurant_id: 0 } })
        .toArray();
      const recipes = recipeDocsToMap(
        recipeDocs as unknown as { pid: string; lines: RecipeLine[] }[],
      );
      await consumeStockInDb(db, items, recipes);
    }

    // Masayı sıfırla.
    const reset = {
      status: "bos",
      items: [],
      startedAt: null,
      waiter: null,
    };
    await db.collection("tables").updateOne(byTenant({ no }), { $set: reset });

    const [freshTable, stock] = await Promise.all([
      db.collection("tables").findOne(byTenant({ no }), { projection: PUBLIC_PROJ }),
      db.collection("stock").find(byTenant(), { projection: PUBLIC_PROJ }).toArray(),
    ]);

    return Response.json({ ok: true, table: freshTable, stock });
  } catch (err) {
    console.error("[pay POST] hata:", err);
    return Response.json({ ok: false, error: "pay_failed" }, { status: 500 });
  }
}
