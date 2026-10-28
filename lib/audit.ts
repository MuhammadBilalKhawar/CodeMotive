import { getDb, isDbConfigured } from "@/lib/db"
import type { AdminUser } from "@/lib/auth/users"

// Who changed what, and when. Written by every admin action; shown at
// /admin/activity. Never contains secrets or full personal data.

export type ActivityEntry = {
  at: Date
  userId: string | null
  userName: string
  action: string
  // e.g. "pricing", "lead", "invoice".
  entity: string
  entityId?: string
  summary: string
}

export async function logActivity(user: AdminUser | null, entry: Omit<ActivityEntry, "at" | "userId" | "userName">) {
  if (!isDbConfigured()) return
  try {
    await (await getDb()).collection<ActivityEntry>("audit_log").insertOne({
      at: new Date(),
      userId: user?.id ?? null,
      userName: user?.name ?? "System",
      ...entry,
    })
  } catch (error) {
    // Logging must never break the action itself.
    console.error("[audit] Couldn't write activity", error)
  }
}

export async function listActivity({ entity, limit = 200 }: { entity?: string; limit?: number } = {}) {
  if (!isDbConfigured()) return []
  const docs = await (await getDb())
    .collection<ActivityEntry>("audit_log")
    .find(entity ? { entity } : {})
    .sort({ at: -1 })
    .limit(limit)
    .toArray()
  return docs.map(({ _id, ...doc }) => ({ id: _id.toString(), ...doc }))
}
