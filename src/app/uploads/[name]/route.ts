/* GET /uploads/<dosya> — yüklenen ürün görselini kalıcı dizinden servis eder.
   (public/ build dizini dışındaki UPLOAD_DIR'den okunur; deploy'dan etkilenmez.) */
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { uploadsDir } from "@/lib/server/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  // Path traversal koruması.
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    return new Response("bad request", { status: 400 });
  }
  const type = TYPES[extname(name).toLowerCase()];
  if (!type) return new Response("not found", { status: 404 });
  try {
    const buf = await readFile(join(uploadsDir(), name));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
