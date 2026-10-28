import { createHash } from "node:crypto"
import { getDb, isDbConfigured } from "@/lib/db"

// Sliding-window limit per IP. Uses MongoDB (shared by all server instances,
// old hits expire through a TTL index) and falls back to memory, which resets
// per instance, when there is no database.

const memoryHits = new Map<string, number[]>()
let ttlIndexReady: Promise<unknown> | null = null

// IPs are hashed so the database never stores raw addresses.
const hashKey = (key: string) => createHash("sha256").update(`cm-rate:${key}`).digest("hex").slice(0, 32)

export async function isRateLimited(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const id = hashKey(key)
  const since = new Date(Date.now() - windowMs)

  if (isDbConfigured()) {
    try {
      const hits = (await getDb()).collection<{ key: string; at: Date }>("rate_limits")
      ttlIndexReady ??= hits.createIndex({ at: 1 }, { expireAfterSeconds: 24 * 60 * 60 })
      await ttlIndexReady
      const recent = await hits.countDocuments({ key: id, at: { $gte: since } })
      if (recent >= limit) return true
      await hits.insertOne({ key: id, at: new Date() })
      return false
    } catch (error) {
      console.error("[rate-limit] Database check failed, using memory", error)
    }
  }

  const recent = (memoryHits.get(id) ?? []).filter((t) => t >= since.getTime())
  if (recent.length >= limit) return true
  memoryHits.set(id, [...recent, Date.now()])
  return false
}
