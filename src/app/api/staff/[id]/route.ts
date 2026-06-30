/* DELETE /api/staff/[id] — personeli sil. YALNIZCA ADMIN.
   Belge tümüyle silinir → kimlik bilgileri (username/passwordHash) de gider.
   Yetki: oturum açıkken sadece "admin" seviyesi silebilir ve kendini silemez.
   Oturum yoksa (auth henüz kurulu değil / demo) mevcut davranış korunur. */
import { cookies } from "next/headers";
import { getDb, byTenant } from "@/lib/server/repo";
import { verifySession, SESSION_COOKIE } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // ---- Yetki kontrolü: silme = admin yetkisi ----
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const sess = verifySession(token);
    if (sess) {
      const me = await db
        .collection("personnel")
        .findOne(byTenant({ id: sess.sub }), { projection: { _id: 0, level: 1 } });
      // Giriş yapılmışsa ve admin değilse → yasak.
      if (!me || me.level !== "admin") {
        return Response.json({ ok: false, error: "forbidden_admin_only" }, { status: 403 });
      }
      // Admin kendini silemez (son yöneticiyi kaybetmeyi önler).
      if (sess.sub === id) {
        return Response.json({ ok: false, error: "cannot_delete_self" }, { status: 400 });
      }
    }
    // Oturum yoksa (demo/auth kapalı) mevcut davranış: silmeye izin ver.

    const r = await db.collection("personnel").deleteOne(byTenant({ id }));
    return Response.json({ ok: true, deleted: r.deletedCount });
  } catch (err) {
    console.error("[staff DELETE] hata:", err);
    return Response.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
}
