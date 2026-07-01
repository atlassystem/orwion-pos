/* PUT /api/tickets/[no] — fiş durumunu değiştir (hazırlanıyor→hazır→teslim).
   Body: { state }. "hazır" işaretlenince readyAt damgalanır. */
import { getDb, byTenant } from "@/lib/server/repo";
import type { SnackState } from "@/lib/pos-modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: SnackState[] = ["hazirlaniyor", "hazir", "teslim"];

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ no: string }> },
) {
  try {
    const { no } = await params;
    const b = (await req.json().catch(() => ({}))) as { state?: string };
    const state = b.state as SnackState;
    if (!VALID.includes(state)) {
      return Response.json({ ok: false, error: "bad_state" }, { status: 400 });
    }
    const db = await getDb();
    const set: Record<string, unknown> = { state };
    if (state === "hazir") set.readyAt = new Date().toISOString();
    const r = await db
      .collection("tickets")
      .updateOne(byTenant({ no: Number(no) }), { $set: set });
    if (r.matchedCount === 0) {
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[tickets PUT] hata:", err);
    return Response.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
