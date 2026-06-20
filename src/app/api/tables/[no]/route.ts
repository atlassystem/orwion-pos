/* PUT /api/tables/[no] — masanın tüm durumunu kaydet (ürün ekle/çıkar, hesap iste). */
import { getDb, byTenant } from "@/lib/server/repo";
import type { Table } from "@/lib/pos-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ no: string }> },
) {
  try {
    const { no } = await params;
    const body = (await req.json()) as Partial<Table>;
    const db = await getDb();

    // Sadece bilinen alanları yaz — restaurant_id/_id istemciden gelse de yok say.
    const set = {
      no,
      hall: body.hall,
      seats: body.seats,
      status: body.status,
      items: Array.isArray(body.items) ? body.items : [],
      startedAt: body.startedAt ?? null,
      waiter: body.waiter ?? null,
      restaurant_id: byTenant().restaurant_id,
    };

    await db
      .collection("tables")
      .updateOne(byTenant({ no }), { $set: set }, { upsert: true });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[tables PUT] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
