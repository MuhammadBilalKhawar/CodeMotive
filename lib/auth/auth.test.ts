import { afterEach, describe, expect, it, vi } from "vitest"
import { _totpCodeAt, generateTotpSecret, verifyTotp } from "@/lib/auth/totp"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { createToken, verifyToken } from "@/lib/auth/session"

afterEach(() => vi.unstubAllEnvs())

describe("TOTP", () => {
  // RFC 6238 test secret "12345678901234567890" in base32; at T=59s the SHA-1 code is 94287082 (8 digits) -> 287082.
  const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"

  it("matches the RFC 6238 test vector", () => {
    expect(_totpCodeAt(rfcSecret, 1)).toBe("287082")
  })

  it("accepts the current code and one step of clock drift, rejects others", () => {
    const secret = generateTotpSecret()
    const now = 1_800_000_000_000
    const step = Math.floor(now / 30_000)
    expect(verifyTotp(secret, _totpCodeAt(secret, step), now)).toBe(true)
    expect(verifyTotp(secret, _totpCodeAt(secret, step - 1), now)).toBe(true)
    expect(verifyTotp(secret, _totpCodeAt(secret, step + 3), now)).toBe(false)
    expect(verifyTotp(secret, "12345", now)).toBe(false)
  })
})

describe("passwords", () => {
  it("verifies the right password only", async () => {
    const hash = await hashPassword("correct horse battery")
    expect(hash).toMatch(/^scrypt\$/)
    expect(await verifyPassword("correct horse battery", hash)).toBe(true)
    expect(await verifyPassword("wrong password!", hash)).toBe(false)
  })
})

describe("session tokens", () => {
  it("round-trips and rejects tampering, expiry and the wrong purpose", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-secret-for-sessions")
    const token = await createToken({ uid: "u1", ver: 2, purpose: "session" }, 60)
    expect(await verifyToken(token)).toMatchObject({ uid: "u1", ver: 2 })
    expect(await verifyToken(token, "2fa")).toBeNull()
    expect(await verifyToken(token.replace(/.$/, (c) => (c === "A" ? "B" : "A")))).toBeNull()

    const expired = await createToken({ uid: "u1", ver: 2, purpose: "session" }, -1)
    expect(await verifyToken(expired)).toBeNull()

    vi.stubEnv("ADMIN_SESSION_SECRET", "a-different-secret")
    expect(await verifyToken(token)).toBeNull()
  })
})
