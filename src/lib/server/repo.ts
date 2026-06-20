/* ============================================================
   Orwion POS — Sunucu veri katmanı (orwion_pos)
   Koleksiyonlar (hepsinde restaurant_id — çok kiracılık):
   categories, products, halls, tables, stock, recipes(BOM),
   personnel, roles, branches, orders, payments.
   Seed idempotent: koleksiyon o kiracı için boşsa bir kez yükler.
   ============================================================ */
import type { Db } from "mongodb";
import { getDb, RID } from "@/lib/mongo";
import { CATS, PRODUCTS, HALLS, seedTables, type OrderItem } from "@/lib/pos-data";
import {
  STOCK,
  RECIPES,
  STAFF,
  BRANCHES,
  LEVELS,
  type RecipeLine,
} from "@/lib/pos-modules";

export { getDb, RID };

/** İstemciye dönen kayıtlardan iç alanları gizle. */
export const PUBLIC_PROJ = { _id: 0, restaurant_id: 0 } as const;

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
    db.collection("tables").createIndex({ restaurant_id: 1, no: 1 }, { unique: true }),
    db.collection("stock").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    db.collection("recipes").createIndex({ restaurant_id: 1, pid: 1 }, { unique: true }),
    db.collection("personnel").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    db.collection("roles").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    db.collection("branches").createIndex({ restaurant_id: 1, id: 1 }, { unique: true }),
    db.collection("orders").createIndex({ restaurant_id: 1, paidAt: -1 }),
    db.collection("payments").createIndex({ restaurant_id: 1, paidAt: -1 }),
  ]);

  const seedColl = async (name: string, docs: object[]) => {
    const count = await db.collection(name).countDocuments(byTenant(), { limit: 1 });
    if (count === 0 && docs.length) {
      await db.collection(name).insertMany(docs.map(stamp));
    }
  };

  await Promise.all([
    seedColl("categories", CATS),
    seedColl("products", PRODUCTS),
    seedColl("halls", HALLS),
    seedColl("tables", seedTables()),
    seedColl("stock", STOCK),
    seedColl(
      "recipes",
      Object.entries(RECIPES).map(([pid, lines]) => ({ pid, lines })),
    ),
    seedColl("personnel", STAFF),
    seedColl("branches", BRANCHES),
    seedColl(
      "roles",
      Object.entries(LEVELS).map(([id, v]) => ({ id, ...v })),
    ),
  ]);
}

/** recipes koleksiyon belgelerini istemcinin beklediği Record<pid, lines>'a çevirir. */
export function recipeDocsToMap(
  docs: { pid: string; lines: RecipeLine[] }[],
): Record<string, RecipeLine[]> {
  return Object.fromEntries(docs.map((r) => [r.pid, r.lines]));
}

/** Sipariş kalemlerini reçeteye göre stoktan düşer (sunucu tarafı, DB'ye yazar). */
export async function consumeStockInDb(
  db: Db,
  items: OrderItem[],
  recipes: Record<string, RecipeLine[]>,
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
