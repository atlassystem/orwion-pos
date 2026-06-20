/* ============================================================
   Orwion POS — MongoDB bağlantısı
   İZOLASYON: yalnızca `orwion_pos` DB. Otelin kaptan_hotels'ine
   ASLA dokunmaz. Auth yok, bindIp 127.0.0.1 (sadece sunucu içi).
   Bağlantı tembel (lazy) kurulur ve global'de önbeklenir; böylece
   build sırasında DB'ye bağlanılmaz, çalışma zamanında tek havuz olur.
   ============================================================ */
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGO_URL || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "orwion_pos";

/** Tek kiracı (tenant) kimliği. Her kayıtta restaurant_id ile ayrım. */
export const RID = process.env.RESTAURANT_ID || "orwion-demo";

type Cache = { promise?: Promise<MongoClient> };
const g = globalThis as unknown as { _orwionMongo?: Cache };
g._orwionMongo ??= {};

function clientPromise(): Promise<MongoClient> {
  const cache = g._orwionMongo!;
  if (!cache.promise) {
    cache.promise = new MongoClient(uri, { maxPoolSize: 10 }).connect();
  }
  return cache.promise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
