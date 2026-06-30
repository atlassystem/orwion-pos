/* /api/products — menü ürünleri (kalıcı: orwion_pos.products, restaurant_id).
   GET: listele. POST: yeni ürün ekle (id sunucuda üretilir). */
import { getDb, RID, byTenant, PUBLIC_PROJ } from "@/lib/server/repo";
import {
  DEFAULT_PRODUCT_EMOJI,
  DEFAULT_PRODUCT_GRAD,
  type Product,
} from "@/lib/pos-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const products = await db
      .collection("products")
      .find(byTenant(), { projection: PUBLIC_PROJ })
      .toArray();
    return Response.json({ ok: true, products });
  } catch (err) {
    console.error("[products GET] hata:", err);
    return Response.json({ ok: false, error: "load_failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json().catch(() => ({}))) as Partial<Product>;
    if (!b?.name || !b?.cat) {
      return Response.json({ ok: false, error: "bad_body" }, { status: 400 });
    }
    const db = await getDb();
    const id =
      (b.id && String(b.id)) ||
      "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

    const doc: Product = {
      id,
      name: String(b.name).trim(),
      cat: String(b.cat),
      price: Number(b.price) || 0,
      route: b.route === "bar" ? "bar" : "mutfak",
      emoji: b.emoji || DEFAULT_PRODUCT_EMOJI,
      grad: b.grad || DEFAULT_PRODUCT_GRAD,
      img: b.img || "",
      // İleride Sedna eşlemesi için opsiyonel; şimdi boşsa yazılmaz.
      ...(b.code ? { code: String(b.code) } : {}),
      // Yönetmelik şeffaflık alanları.
      kcal: Number(b.kcal) || 0,
      allergens: Array.isArray(b.allergens) ? b.allergens.map(String) : [],
      meat: b.meat ? String(b.meat) : "Yok",
      content: b.content ? String(b.content).trim() : "",
      // ÖKC / mali fiş: ürüne özel KDV oranı (yüzde). 0 → varsayılan oran kullanılır.
      kdv_orani: Number(b.kdv_orani) || 0,
      // EUR fiyatı (TL'den kurla hesaplanır; elle de düzenlenebilir).
      eur_price: Number(b.eur_price) || 0,
      // Çoklu şube: ürünün geçerli olduğu şubeler (boş = TÜM şubeler).
      branches: Array.isArray(b.branches) ? b.branches.map(String) : [],
    };

    await db.collection("products").insertOne({ ...doc, restaurant_id: RID });
    return Response.json({ ok: true, product: doc });
  } catch (err) {
    console.error("[products POST] hata:", err);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
