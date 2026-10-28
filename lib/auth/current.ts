import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE, verifyToken } from "@/lib/auth/session"
import { getUserById, type AdminUser, type Role } from "@/lib/auth/users"
import { isDbConfigured } from "@/lib/db"

// The signed-in admin for this request, or null. Unlike proxy.ts (which only
// checks the signature), this confirms the account still exists, is active and
// hasn't been signed out everywhere since the cookie was issued.
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  if (!isDbConfigured()) return null
  const payload = await verifyToken((await cookies()).get(SESSION_COOKIE)?.value)
  if (!payload) return null
  const user = await getUserById(payload.uid)
  if (!user || !user.active || user.sessionVersion !== payload.ver) return null
  return user
})

// For pages: redirect to sign-in, or to the dashboard if the role isn't enough.
export async function requireUser(role?: Role) {
  const user = await getCurrentUser()
  if (!user) redirect("/admin/login")
  if (role === "owner" && user.role !== "owner") redirect("/admin?denied=1")
  return user
}

export type ActionError = { ok: false; error: string }

// For server actions: the user, or an error result to return to the form.
export async function userForAction(role?: Role): Promise<AdminUser | ActionError> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." }
  if (role === "owner" && user.role !== "owner") return { ok: false, error: "Only owners can do this." }
  return user
}

export const isActionError = (value: AdminUser | ActionError): value is ActionError => "ok" in value
