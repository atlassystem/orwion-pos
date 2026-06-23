/* GET /api/report/summary?date=YYYY-MM-DD&branch= — günlük özet (gerçek order'lardan).
   Kapsam: AKTİF ŞUBE (branch_id) + seçili gün. Döner:
   { revenue, cost, profit, margin, orderCount }. */
import { getDb, byTenant, DEFAULT_BRANCH } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Otel yerel saati (Türkiye, UTC+3 — DST yok). Gün sınırları buna göre. */
const TZ_OFFSET = "+03:00";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const branch = url.searchParams.get("branch") || DEFAULT_BRANCH;
    const dateParam = url.searchParams.get("date") || "";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().slice(0, 10);

    const start = new Date(`${date}T00:00:00.000${TZ_OFFSET}`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const db = await getDb();
    const orders = await db
      .collection("orders")
      .find(byTenant({ branch_id: branch, paidAt: { $gte: start, $lt: end } }), {
        projection: { _id: 0, total: 1, costTotal: 1 },
      })
      .toArray();

    const r2 = (n: number) => Math.round(n * 100) / 100;
    const revenue = r2(orders.reduce((s, o) => s + (Number(o.total) || 0), 0));
    const cost = r2(orders.reduce((s, o) => s + (Number(o.costTotal) || 0), 0));
    const profit = r2(revenue - cost);
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return Response.json({
      ok: true,
      date,
      branch,
      revenue,
      cost,
      profit,
      margin,
      orderCount: orders.length,
    });
  } catch (err) {
    console.error("[report summary] hata:", err);
    return Response.json({ ok: false, error: "report_failed" }, { status: 500 });
  }
}
