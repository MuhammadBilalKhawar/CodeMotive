"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/auth/password"
import { generateTotpSecret, totpQrDataUrl, totpUri, verifyTotp } from "@/lib/auth/totp"
import { getTotpSecret, getUserCredentials, getUserById, listUsers, setPassword, setTotp, signOutEverywhere, updateUser, createUser } from "@/lib/auth/users"
import { startSession } from "@/lib/auth/cookies"
import { isActionError, userForAction } from "@/lib/auth/current"
import { logActivity } from "@/lib/audit"
import type { ActionResult, FormState } from "@/app/admin/actions/types"

const passwordField = z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`).max(200)

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await userForAction()
  if (isActionError(user)) return { error: user.error }
  const creds = await getUserCredentials(user.email)
  if (!creds || !(await verifyPassword(String(formData.get("current") ?? ""), creds.passwordHash))) return { error: "Your current password isn't right." }
  const next = passwordField.safeParse(formData.get("password"))
  if (!next.success) return { error: next.error.issues[0].message }
  if (formData.get("password") !== formData.get("confirm")) return { error: "The new passwords don't match." }

  await setPassword(user.id, next.data)
  // Other devices are signed out; keep this one signed in.
  const fresh = await getUserById(user.id)
  if (fresh) await startSession(fresh)
  await logActivity(user, { action: "changed password", entity: "account", entityId: user.id, summary: `${user.name} changed their password` })
  return { ok: true, message: "Password changed. Other devices have been signed out." }
}

// Step 1: a new secret and QR code (not saved until confirmed with a code).
export async function startTwoFactorSetup(): Promise<ActionResult<{ secret: string; qr: string }>> {
  const user = await userForAction()
  if (isActionError(user)) return user
  const secret = generateTotpSecret()
  return { ok: true, data: { secret, qr: await totpQrDataUrl(totpUri(secret, user.email)) } }
}

// Step 2: the code from the app proves the secret was scanned correctly.
export async function confirmTwoFactor(secret: string, code: string): Promise<ActionResult> {
  const user = await userForAction()
  if (isActionError(user)) return user
  if (!/^[A-Z2-7]{32}$/.test(secret) || !verifyTotp(secret, code)) return { ok: false, error: "That code isn't right. Try the newest code in your app." }
  await setTotp(user.id, secret)
  await logActivity(user, { action: "enabled 2FA", entity: "account", entityId: user.id, summary: `${user.name} turned on two-factor sign-in` })
  revalidatePath("/admin/account")
  return { ok: true }
}

export async function disableTwoFactor(code: string): Promise<ActionResult> {
  const user = await userForAction()
  if (isActionError(user)) return user
  const secret = await getTotpSecret(user.id)
  if (!secret || !verifyTotp(secret, code)) return { ok: false, error: "That code isn't right." }
  await setTotp(user.id, null)
  await logActivity(user, { action: "disabled 2FA", entity: "account", entityId: user.id, summary: `${user.name} turned off two-factor sign-in` })
  revalidatePath("/admin/account")
  return { ok: true }
}

export async function signOutOtherDevices(): Promise<ActionResult> {
  const user = await userForAction()
  if (isActionError(user)) return user
  await signOutEverywhere(user.id)
  const fresh = await getUserById(user.id)
  if (fresh) await startSession(fresh)
  await logActivity(user, { action: "signed out everywhere", entity: "account", entityId: user.id, summary: `${user.name} signed out all other devices` })
  return { ok: true }
}

// --- Team (owners only) -------------------------------------------------------

const newUserSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["owner", "member"]),
  password: passwordField,
})

export async function addTeamMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await userForAction("owner")
  if (isActionError(user)) return { error: user.error }
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), role: String(formData.get("role") ?? "owner") }
  const parsed = newUserSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message, values }
  if (await getUserCredentials(parsed.data.email)) return { error: "An account with that email already exists.", values }
  const id = await createUser(parsed.data)
  await logActivity(user, { action: "added team member", entity: "team", entityId: id, summary: `${user.name} added ${parsed.data.name} (${parsed.data.role})` })
  revalidatePath("/admin/settings/team")
  return { ok: true, message: `Account created. Share the temporary password with ${parsed.data.name} privately; they should change it after signing in.` }
}

export async function updateTeamMember(id: string, patch: { role?: "owner" | "member"; active?: boolean }): Promise<ActionResult> {
  const user = await userForAction("owner")
  if (isActionError(user)) return user
  const target = await getUserById(id)
  if (!target) return { ok: false, error: "That account doesn't exist." }
  // Never leave the business without an active owner.
  const activeOwners = (await listUsers()).filter((u) => u.role === "owner" && u.active && u.id !== id)
  const losesOwner = (patch.role === "member" || patch.active === false) && target.role === "owner"
  if (losesOwner && activeOwners.length === 0) return { ok: false, error: "There must always be at least one active owner." }

  await updateUser(id, patch)
  const what = patch.active === false ? "deactivated" : patch.active === true ? "reactivated" : `made ${patch.role}`
  await logActivity(user, { action: "updated team member", entity: "team", entityId: id, summary: `${user.name} ${what} ${target.name}` })
  revalidatePath("/admin/settings/team")
  return { ok: true }
}

export async function resetTeamPassword(id: string, password: string): Promise<ActionResult> {
  const user = await userForAction("owner")
  if (isActionError(user)) return user
  const parsed = passwordField.safeParse(password)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const target = await getUserById(id)
  if (!target) return { ok: false, error: "That account doesn't exist." }
  await setPassword(id, parsed.data)
  // Resetting also turns off their 2FA so they can get back in.
  await setTotp(id, null)
  await logActivity(user, { action: "reset password", entity: "team", entityId: id, summary: `${user.name} reset ${target.name}'s password` })
  revalidatePath("/admin/settings/team")
  return { ok: true }
}
