/* POST /api/upload — ürün fotoğrafı yükleme.
   Body: { dataUrl } (istemcide ~800px'e küçültülmüş JPEG/PNG/WebP base64).
   Diske public/uploads/<benzersiz>.<ext> yazar, { url } döner.
   Not: Görsel URL olarak saklanır → bootstrap/products şişmez. */
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { uploadsDir } from "@/lib/server/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 1_500_000; // ~1.5MB (istemci zaten küçültür)

export async function POST(req: Request) {
  try {
    const { dataUrl } = (await req.json().catch(() => ({}))) as { dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== "string") {
      return Response.json({ ok: false, error: "no_data" }, { status: 400 });
    }
    const m = dataUrl.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!m) {
      return Response.json({ ok: false, error: "bad_image" }, { status: 400 });
    }
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const buf = Buffer.from(m[2], "base64");
    if (buf.length === 0) {
      return Response.json({ ok: false, error: "empty" }, { status: 400 });
    }
    if (buf.length > MAX_BYTES) {
      return Response.json({ ok: false, error: "too_large" }, { status: 413 });
    }

    const dir = uploadsDir();
    await mkdir(dir, { recursive: true });
    const name =
      "u" +
      Date.now().toString(36) +
      Math.floor(Math.random() * 1e6).toString(36) +
      "." +
      ext;
    await writeFile(join(dir, name), buf);

    return Response.json({ ok: true, url: "/uploads/" + name });
  } catch (err) {
    console.error("[upload POST] hata:", err);
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
