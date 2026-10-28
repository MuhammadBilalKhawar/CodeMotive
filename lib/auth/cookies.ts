import { createHash, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { SESSION_COOKIE, SESSION_MAX_AGE, TWO_FACTOR_COOKIE, TWO_FACTOR_MAX_AGE, createToken } from "@/lib/auth/session"
import type { AdminUser } from "@/lib/auth/users"

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge,
})

export async function startSession(user: AdminUser) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, await createToken({ uid: user.id, ver: user.sessionVersion, purpose: "session" }, SESSION_MAX_AGE), cookieOptions(SESSION_MAX_AGE))
  jar.delete(TWO_FACTOR_COOKIE)
}

// Password was right; the 6-digit code is still needed.
export async function startTwoFactor(user: AdminUser) {
  ;(await cookies()).set(
    TWO_FACTOR_COOKIE,
    await createToken({ uid: user.id, ver: user.sessionVersion, purpose: "2fa" }, TWO_FACTOR_MAX_AGE),
    cookieOptions(TWO_FACTOR_MAX_AGE),
  )
}

export async function endSession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  jar.delete(TWO_FACTOR_COOKIE)
}

// Constant-time check of the bootstrap ADMIN_PASSWORD (used only for first setup).
export function matchesAdminPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const digest = (s: string) => createHash("sha256").update(s).digest()
  return timingSafeEqual(digest(input), digest(expected))
}
