/* ============================================================
   Orwion POS — Sunucu veri katmanı (orwion_pos)
   Koleksiyonlar (hepsinde restaurant_id — çok kiracılık):
   categories, products, halls, tables, stock, recipes(BOM),
   personnel, roles, branches, orders, payments.
   Seed idempotent: koleksiyon o kiracı için boşsa bir kez yükler.
   ============================================================ */
import type { Db } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb, RID } from "@/lib/mongo";
import { CATS, PRODUCTS, HALLS, seedTables, type OrderItem } from "@/lib/pos-data";
import {
  STOCK,
  STAFF,
  BRANCHES,
  LEVELS,
  type RecipeLine,
  type StockRecipeLine,
} from "@/lib/pos-modules";

/** Varsayılan/yedek şube kimliği (parametre gelmezse). */
export const DEFAULT_BRANCH = BRANCHES[0].id;

/** İlk giriş için varsayılan admin kimliği (seed). Kullanıcı sonra değiştirir. */
export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "Orwion!2026";

export { getDb, RID };

/** İstemciye dönen kayıtlardan iç alanları gizle (şifre hash'i ASLA dönmez). */
export const PUBLIC_PROJ = { _id: 0, restaurant_id: 0, passwordHash: 0 } as const;

/** Kiracı filtresi. */
export const byTenant = (extra: Record<string, unknown> = {}) => ({
  restaurant_id: RID,
  ...extra,
});

const stamp = <T extends object>(doc: T) => ({ ...doc, restaurant_id: RID });

/**
 * Koleksiyonları bir kez tohumlar (idempotent) ve indeksleri kurar.
 * Her koleksiyon için: o kiracıya ait kayıt yoksa seed verisini yükler.
 */
export async function seedIfEmpty(db: Db): Promise<void> {
  // Benzersizlik indeksleri (createIndex idempotenttir) — çift kayıt önler.
  await Promise.all([
    db.collection("categories").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    db.collection("products").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    db.collection("halls").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    // Masalar şubeye göre ayrı: aynı masa no'su her şubede ayrı kayıt.
    db.collection("tables").createIndex({ restaurant_id: 1, branch_id: 1, no: 1 }, { unique: true }),
    db.collection("stock").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    db.collection("recipes").createIndex({ restaurant_id: 1, pid: 1 }, { unique: true }),
    // Sedna maliyet kataloğu — ORTAK (şube yok), code benzersiz.
    db.collection("sedna_products").createIndex({ restaurant_id: 1, code: 1 }, { unique: true }),
    db.collection("personnel").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    // Giriş kullanıcı adı benzersiz (yalnızca username taşıyan kayıtlar için).
    db.collection("personnel").createIndex(
      { restaurant_id: 1, username: 1 },
      { unique: true, partialFilterExpression: { username: { $type: "string" } } },
    ),
    db.collection("roles").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    db.collection("branches").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    // Order/payment'lar şubeye göre raporlanabilsin diye branch_id ile indeksli.
    db.collection("orders").createIndex({ restaurant_id: 1, branch_id: 1, paidAt: -1 }),
    db.collection("payments").createIndex({ restaurant_id: 1, branch_id: 1, paidAt: -1 }),
  ]);

  const seedColl = async (name: string, docs: object[]) => {
    const count = await db.collection(name).countDocuments(byTenant(), { limit: 1 });
    if (count === 0 && docs.length) {
      await db.collection(name).insertMany(docs.map(stamp));
    }
  };

  // Her şube KENDİ masa setiyle başlar (aynı seed, branch_id ile etiketli).
  const branchTables = BRANCHES.flatMap((b) =>
    seedTables().map((t) => ({ ...t, branch_id: b.id })),
  );

  // MENÜ (kategori + ürün) YALNIZCA ilk kurulumda tohumlanır. Bir kez işaretlendikten
  // sonra kullanıcı menüyü boşaltsa BİLE demo GERİ GELMEZ (gerçek menü modu).
  const menuFlag = await db.collection("meta").findOne(byTenant({ key: "menu_init" }));
  const menuInit = !!(menuFlag as { done?: boolean } | null)?.done;

  await Promise.all([
    ...(menuInit ? [] : [seedColl("categories", CATS), seedColl("products", PRODUCTS)]),
    seedColl("halls", HALLS),
    seedColl("tables", branchTables),
    seedColl("stock", STOCK),
    // Reçeteler artık Sedna malzemeli (boş başlar; kullanıcı bağlar).
    // Eski stok-bazlı demo reçeteler seed EDİLMEZ.
    seedColl("personnel", STAFF),
    seedColl("branches", BRANCHES),
    seedColl(
      "roles",
      Object.entries(LEVELS).map(([id, v]) => ({ id, ...v })),
    ),
  ]);

  // Menü bir kez kuruldu → işaretle. Bundan sonra boşalsa bile yeniden tohumlanmaz.
  await db.collection("meta").updateOne(
    byTenant({ key: "menu_init" }),
    { $set: { done: true, at: new Date().toISOString() } },
    { upsert: true },
  );

  await ensureDefaultAdmin(db);
  await ensureMenuInfo(db);
}

/**
 * Yönetmelik şeffaflık alanlarını (kcal/allergens/meat/content) eski ürünlere
 * geriye dönük doldurur (idempotent). Yalnızca `content` alanı HİÇ olmayan
 * (yani bu özellikten önce tohumlanmış) seed ürünlerine yazar; kullanıcının
 * sonradan düzenlediği ürünlerin değerlerini EZMEZ.
 */
async function ensureMenuInfo(db: Db): Promise<void> {
  const coll = db.collection("products");
  const ops = PRODUCTS.filter((p) => p.content !== undefined).map((p) => ({
    updateOne: {
      filter: byTenant({ id: p.id, content: { $exists: false } }),
      update: {
        $set: {
          kcal: p.kcal ?? 0,
          allergens: p.allergens ?? [],
          meat: p.meat ?? "Yok",
          content: p.content ?? "",
        },
      },
    },
  }));
  if (ops.length) await coll.bulkWrite(ops);
}

/**
 * İlk giriş için bir admin kimliği garanti eder (idempotent).
 * "admin" kullanıcı adı yoksa, admin seviyesindeki kullanıcıya (yoksa ilk
 * kullanıcıya) username="admin" + bcrypt(varsayılan şifre) atar.
 * Düz şifre saklanmaz; yalnızca hash.
 */
async function ensureDefaultAdmin(db: Db): Promise<void> {
  const coll = db.collection("personnel");
  const existing = await coll.findOne(byTenant({ username: DEFAULT_ADMIN_USERNAME }));
  if (existing) return;
  const target =
    (await coll.findOne(byTenant({ level: "admin" }))) ??
    (await coll.findOne(byTenant()));
  if (!target) return;
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await coll.updateOne(
    byTenant({ id: target.id }),
    { $set: { username: DEFAULT_ADMIN_USERNAME, passwordHash } },
  );
}

/** recipes koleksiyon belgelerini istemcinin beklediği Record<pid, lines>'a çevirir. */
export function recipeDocsToMap(
  docs: { pid: string; lines: RecipeLine[] }[],
): Record<string, RecipeLine[]> {
  return Object.fromEntries(docs.map((r) => [r.pid, r.lines]));
}

/**
 * Verilen Sedna kodları için güncel birim maliyet haritası (code → unit_cost).
 * Reçete maliyeti CANLI olarak buradan hesaplanır.
 */
export async function sednaCostMap(
  db: Db,
  codes: string[],
): Promise<Record<string, number>> {
  const uniq = [...new Set(codes.filter(Boolean))];
  if (!uniq.length) return {};
  const docs = await db
    .collection("sedna_products")
    .find(byTenant({ code: { $in: uniq } }), { projection: { _id: 0, code: 1, unit_cost: 1 } })
    .toArray();
  return Object.fromEntries(docs.map((d) => [d.code as string, (d.unit_cost as number) ?? 0]));
}

/** (LEGACY — artık çağrılmaz) Eski stok-bazlı reçeteyle stok düşümü. */
export async function consumeStockInDb(
  db: Db,
  items: OrderItem[],
  recipes: Record<string, StockRecipeLine[]>,
): Promise<void> {
  const deduct: Record<string, number> = {};
  for (const it of items) {
    const lines = recipes[it.pid];
    if (!lines) continue;
    for (const l of lines) {
      deduct[l.stockId] = (deduct[l.stockId] ?? 0) + l.qty * it.qty;
    }
  }
  const ops = Object.entries(deduct).map(([stockId, amount]) => ({
    updateOne: {
      filter: byTenant({ id: stockId }),
      update: [
        {
          $set: {
            qty: {
              $max: [
                0,
                {
                  $round: [{ $subtract: ["$qty", amount] }, 3],
                },
              ],
            },
          },
        },
      ],
    },
  }));
  if (ops.length) await db.collection("stock").bulkWrite(ops);
}
