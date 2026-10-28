import { getEnv } from "@/lib/env"

// Cloudflare Turnstile check. Returns true when Turnstile isn't configured.
export async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = getEnv().TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip !== "unknown") body.set("remoteip", ip)
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (error) {
    console.error("[turnstile] Verification request failed", error)
    return false
  }
}
