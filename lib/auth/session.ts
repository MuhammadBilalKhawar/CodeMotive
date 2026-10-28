// Signed, expiring tokens in httpOnly cookies. Web Crypto only, so this runs
// in proxy.ts as well as in server actions and route handlers.
//
// Signing key: ADMIN_SESSION_SECRET, or (until that's set) one derived from
// ADMIN_PASSWORD.

export const SESSION_COOKIE = "cm_admin"
export const TWO_FACTOR_COOKIE = "cm_admin_2fa"
export const SESSION_MAX_AGE = 60 * 60 * 12 // 12 hours, in seconds
export const TWO_FACTOR_MAX_AGE = 60 * 5 // 5 minutes to enter the code

export type SessionPayload = {
  uid: string
  // Bumped on password change / "sign out everywhere"; checked against the user record.
  ver: number
  purpose: "session" | "2fa"
  exp: number
}

const encoder = new TextEncoder()

function signingSecret() {
  const explicit = process.env.ADMIN_SESSION_SECRET
  if (explicit) return explicit
  const password = process.env.ADMIN_PASSWORD
  return password ? `codemotive-admin:${password}` : null
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

const fromBase64Url = (text: string) => {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4)
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function hmac(message: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message))))
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const isAuthConfigured = () => Boolean(signingSecret())

export async function createToken(payload: Omit<SessionPayload, "exp">, maxAgeSeconds: number) {
  const secret = signingSecret()
  if (!secret) throw new Error("ADMIN_SESSION_SECRET or ADMIN_PASSWORD must be set")
  const body = toBase64Url(encoder.encode(JSON.stringify({ ...payload, exp: Date.now() + maxAgeSeconds * 1000 })))
  return `${body}.${await hmac(body, secret)}`
}

export async function verifyToken(token: string | undefined, purpose: SessionPayload["purpose"] = "session") {
  const secret = signingSecret()
  if (!secret || !token) return null
  const [body, signature] = token.split(".")
  if (!body || !signature || !safeEqual(signature, await hmac(body, secret))) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload
    if (payload.purpose !== purpose || payload.exp < Date.now() || !payload.uid) return null
    return payload
  } catch {
    return null
  }
}
