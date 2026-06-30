/* GET /api/report/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&branch= — günlük/dönemsel
   satış raporu (gerçek order'lardan). Kapsam: AKTİF ŞUBE (branch_id) + [from..to]
   (uçlar dahil). `from` verilmezse `to` ile aynı gün (tek gün = günlük rapor).
   Döner: {
     summary: { revenue, cost, profit, margin, orderCount },
     byDay:    [{ date, revenue, cost, profit, orderCount }],   // tarihe göre artan
     byProduct:[{ pid, name, qty, revenue, cost, profit }],     // ciroya göre azalan
     byMethod: [{ method, count, amount }],                     // tutara göre azalan
   } */
import { getDb, byTenant, DEFAULT_BRANCH } from "@/lib/server/repo";
import { KDV_ORAN_DEFAULT } from "@/lib/pos-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Otel yerel saati (Türkiye, UTC+3 — DST yok). Gün sınırları buna göre. */
const TZ_OFFSET = "+03:00";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Bir Date'i otel yerel saatine göre YYYY-MM-DD'ye çevirir (gün gruplaması). */
function localDay(d: Date): string {
  // paidAt UTC saklanır; +03:00 ekleyip UTC parçalarını okumak yerel günü verir.
  return new Date(d.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

interface OrderLine {
  pid?: string;
  name?: string;
  qty?: number;
  lineTotal?: number;
  costTotal?: number;
}

interface VatRow {
  rate?: number;
  base?: number;
  kdv?: number;
  total?: number;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const branch = url.searchParams.get("branch") || DEFAULT_BRANCH;
    const toParam = url.searchParams.get("to") || "";
    const fromParam = url.searchParams.get("from") || "";

    const today = new Date().toISOString().slice(0, 10);
    let to = ISO.test(toParam) ? toParam : today;
    let from = ISO.test(fromParam) ? fromParam : to;
    // Ters girilirse (from > to) sınırları yer değiştir.
    if (from > to) [from, to] = [to, from];

    const start = new Date(`${from}T00:00:00.000${TZ_OFFSET}`);
    // `to` günü dahil → ertesi günün başlangıcına kadar.
    const endExclusive = new Date(`${to}T00:00:00.000${TZ_OFFSET}`);
    const end = new Date(endExclusive.getTime() + 24 * 60 * 60 * 1000);

    const db = await getDb();
    const orders = await db
      .collection("orders")
      .find(byTenant({ branch_id: branch, paidAt: { $gte: start, $lt: end } }), {
        projection: {
          _id: 0,
          total: 1,
          subtotal: 1,
          kdv: 1,
          costTotal: 1,
          method: 1,
          paidAt: 1,
          items: 1,
          vatBreakdown: 1,
          fiscal: 1,
        },
      })
      .toArray();

    // ---- Özet (dönem toplamı) ----
    const revenue = r2(orders.reduce((s, o) => s + (Number(o.total) || 0), 0));
    const cost = r2(orders.reduce((s, o) => s + (Number(o.costTotal) || 0), 0));
    const profit = r2(revenue - cost);
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    // ---- Günlük dağılım ----
    const dayMap = new Map<
      string,
      { date: string; revenue: number; cost: number; orderCount: number }
    >();
    // ---- Ürün kırılımı ----
    const prodMap = new Map<
      string,
      { pid: string; name: string; qty: number; revenue: number; cost: number }
    >();
    // ---- Ödeme türü kırılımı ----
    const methodMap = new Map<string, { method: string; count: number; amount: number }>();
    // ---- Mali fiş: KDV kırılımı (orana göre) + fiş durumu sayısı ----
    const vatMap = new Map<
      number,
      { rate: number; base: number; kdv: number; total: number }
    >();
    const fiscalMap = new Map<string, number>();

    for (const o of orders) {
      const day = o.paidAt instanceof Date ? localDay(o.paidAt) : localDay(new Date(o.paidAt));
      const dRow = dayMap.get(day) ?? { date: day, revenue: 0, cost: 0, orderCount: 0 };
      dRow.revenue += Number(o.total) || 0;
      dRow.cost += Number(o.costTotal) || 0;
      dRow.orderCount += 1;
      dayMap.set(day, dRow);

      const m = (o.method as string) || "nakit";
      const mRow = methodMap.get(m) ?? { method: m, count: 0, amount: 0 };
      mRow.count += 1;
      mRow.amount += Number(o.total) || 0;
      methodMap.set(m, mRow);

      for (const it of (o.items ?? []) as OrderLine[]) {
        const pid = it.pid || it.name || "?";
        const pRow =
          prodMap.get(pid) ??
          { pid, name: it.name || pid, qty: 0, revenue: 0, cost: 0 };
        pRow.qty += Number(it.qty) || 0;
        pRow.revenue += Number(it.lineTotal) || 0;
        pRow.cost += Number(it.costTotal) || 0;
        prodMap.set(pid, pRow);
      }

      // KDV kırılımı: order'da vatBreakdown varsa onu topla; yoksa (ÖKC öncesi
      // eski kayıt) tek satır olarak varsayılan orandan türet.
      const ot = Number(o.total) || 0;
      const okdv = Number(o.kdv) || 0;
      const vb: VatRow[] =
        Array.isArray(o.vatBreakdown) && o.vatBreakdown.length
          ? (o.vatBreakdown as VatRow[])
          : [
              {
                rate: KDV_ORAN_DEFAULT,
                base: Number(o.subtotal) || ot - okdv,
                kdv: okdv,
                total: ot,
              },
            ];
      for (const v of vb) {
        const rate = Number(v.rate) || KDV_ORAN_DEFAULT;
        const vRow = vatMap.get(rate) ?? { rate, base: 0, kdv: 0, total: 0 };
        vRow.base += Number(v.base) || 0;
        vRow.kdv += Number(v.kdv) || 0;
        vRow.total += Number(v.total) || 0;
        vatMap.set(rate, vRow);
      }

      // Mali fiş durumu — alan yoksa (eski kayıt) "beklemede" say.
      const fst =
        (o.fiscal && (o.fiscal as { status?: string }).status) || "beklemede";
      fiscalMap.set(fst, (fiscalMap.get(fst) ?? 0) + 1);
    }

    const byDay = [...dayMap.values()]
      .map((d) => ({
        date: d.date,
        revenue: r2(d.revenue),
        cost: r2(d.cost),
        profit: r2(d.revenue - d.cost),
        orderCount: d.orderCount,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    const byProduct = [...prodMap.values()]
      .map((p) => ({
        pid: p.pid,
        name: p.name,
        qty: p.qty,
        revenue: r2(p.revenue),
        cost: r2(p.cost),
        profit: r2(p.revenue - p.cost),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const byMethod = [...methodMap.values()]
      .map((m) => ({ method: m.method, count: m.count, amount: r2(m.amount) }))
      .sort((a, b) => b.amount - a.amount);

    // Mali fiş KDV kırılımı (orana göre artan) ve fiş durumu sayısı.
    const vat = [...vatMap.values()]
      .map((v) => ({ rate: v.rate, base: r2(v.base), kdv: r2(v.kdv), total: r2(v.total) }))
      .sort((a, b) => a.rate - b.rate);
    const fiscal = [...fiscalMap.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    return Response.json({
      ok: true,
      from,
      to,
      branch,
      summary: { revenue, cost, profit, margin, orderCount: orders.length },
      byDay,
      byProduct,
      byMethod,
      // ÖKC / mali fiş özeti.
      vat,
      fiscal,
    });
  } catch (err) {
    console.error("[report sales] hata:", err);
    return Response.json({ ok: false, error: "report_failed" }, { status: 500 });
  }
}
