/* DELETE /api/staff/[id] — personeli sil.
   Belge tümüyle silinir → kimlik bilgileri (username/passwordHash) de gider. */
import { getDb, byTenant } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const r = await db.collection("personnel").deleteOne(byTenant({ id }));
    return Response.json({ ok: true, deleted: r.deletedCount });
  } catch (err) {
    console.error("[staff DELETE] hata:", err);
    return Response.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
}
