import { MongoClient, type Db } from "mongodb"

// One client per server instance, reused across requests and dev hot reloads.
const globalForMongo = globalThis as unknown as { mongoClient?: Promise<MongoClient> }

export const isDbConfigured = () => Boolean(process.env.MONGODB_URI)

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not set")

  globalForMongo.mongoClient ??= new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect()
  try {
    const client = await globalForMongo.mongoClient
    return client.db(process.env.MONGODB_DB || "codemotive")
  } catch (error) {
    // Let the next request retry instead of caching a failed connection.
    globalForMongo.mongoClient = undefined
    throw error
  }
}
