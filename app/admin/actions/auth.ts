"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { isDbConfigured } from "@/lib/db"
import { isRateLimited } from "@/lib/rate-limit"
import { verifyPassword, PASSWORD_MIN_LENGTH } from "@/lib/auth/password"
import { verifyTotp } from "@/lib/auth/totp"
import { TWO_FACTOR_COOKIE, verifyToken } from "@/lib/auth/session"
import { countUsers, createUser, getTotpSecret, getUserById, getUserCredentials, recordLogin } from "@/lib/auth/users"
import { endSession, matchesAdminPassword, startSession, startTwoFactor } from "@/lib/auth/cookies"
import { getCurrentUser } from "@/lib/auth/current"
import { logActivity } from "@/lib/audit"
import type { FormState } from "@/app/admin/actions/types"

const LOGIN_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 }

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

const safeNext = (next: FormDataEntryValue | null) => {
  const value = String(next ?? "")
  return value.startsWith("/admin") && !value.startsWith("/admin/login") && !value.startsWith("/admin/setup") ? value : "/admin"
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isDbConfigured()) return { error: "The database isn't connected. Add MONGODB_URI first." }
  if ((await countUsers()) === 0) return { error: "No admin accounts yet. Create the first one at /admin/setup." }
  if (await isRateLimited(`login:${await clientIp()}`, LOGIN_LIMIT)) return { error: "Too many attempts. Try again in 15 minutes." }

  const creds = await getUserCredentials(String(formData.get("email") ?? ""))
  const passwordOk = creds ? await verifyPassword(String(formData.get("password") ?? ""), creds.passwordHash) : false
  if (!creds || !passwordOk || !creds.user.active) {
    await logActivity(null, { action: "sign-in failed", entity: "account", summary: `Failed sign-in for ${String(formData.get("email") ?? "").slice(0, 80)}` })
    return { error: "That email and password don't match an active account.", values: { email: String(formData.get("email") ?? "") } }
  }

  const next = safeNext(formData.get("next"))
  if (creds.user.totpEnabled) {
    await startTwoFactor(creds.user)
    redirect(`/admin/login/verify?next=${encodeURIComponent(next)}`)
  }

  await startSession(creds.user)
  await recordLogin(creds.user.id)
  await logActivity(creds.user, { action: "signed in", entity: "account", summary: `${creds.user.name} signed in` })
  redirect(next)
}

export async function verifyTwoFactor(_prev: FormState, formData: FormData): Promise<FormState> {
  const pending = await verifyToken((await cookies()).get(TWO_FACTOR_COOKIE)?.value, "2fa")
  if (!pending) return { error: "That took too long. Sign in again." }
  if (await isRateLimited(`2fa:${pending.uid}`, LOGIN_LIMIT)) return { error: "Too many attempts. Try again in 15 minutes." }

  const user = await getUserById(pending.uid)
  const secret = await getTotpSecret(pending.uid)
  if (!user || !user.active || user.sessionVersion !== pending.ver || !secret) return { error: "Sign in again." }
  if (!verifyTotp(secret, String(formData.get("code") ?? ""))) return { error: "That code isn't right. Check your authenticator app." }

  await startSession(user)
  await recordLogin(user.id)
  await logActivity(user, { action: "signed in", entity: "account", summary: `${user.name} signed in (2FA)` })
  redirect(safeNext(formData.get("next")))
}

const setupSchema = z.object({
  adminPassword: z.string().min(1),
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`).max(200),
})

// First owner account. Only works while there are no accounts, and needs the
// ADMIN_PASSWORD from the environment to prove you own the site.
export async function setupOwner(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isDbConfigured()) return { error: "The database isn't connected. Add MONGODB_URI first." }
  if ((await countUsers()) > 0) return { error: "Setup is already done. Sign in instead." }
  if (await isRateLimited(`setup:${await clientIp()}`, LOGIN_LIMIT)) return { error: "Too many attempts. Try again in 15 minutes." }

  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") }
  const parsed = setupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message, values }
  if (!matchesAdminPassword(parsed.data.adminPassword)) return { error: "The setup password (ADMIN_PASSWORD) isn't right.", values }

  const id = await createUser({ name: parsed.data.name, email: parsed.data.email, password: parsed.data.password, role: "owner" })
  const user = await getUserById(id)
  if (!user) return { error: "Couldn't create the account." }
  await startSession(user)
  await recordLogin(user.id)
  await logActivity(user, { action: "created account", entity: "account", entityId: id, summary: `${user.name} set up the first owner account` })
  redirect("/admin/account?welcome=1")
}

export async function logout() {
  const user = await getCurrentUser()
  if (user) await logActivity(user, { action: "signed out", entity: "account", summary: `${user.name} signed out` })
  await endSession()
  redirect("/admin/login")
}
