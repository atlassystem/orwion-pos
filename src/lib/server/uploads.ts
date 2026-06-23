/* Yüklenen ürün görselleri için kalıcı dizin.
   Production'da UPLOAD_DIR (build dışı, www-data yazabilir) kullanılır; böylece
   deploy'da silinmez ve izin sorunu olmaz. Yereldeyse public/uploads. */
import { join } from "path";

export function uploadsDir(): string {
  return process.env.UPLOAD_DIR || join(process.cwd(), "public", "uploads");
}
