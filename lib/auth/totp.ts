import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import QRCode from "qrcode"

// Time-based one-time passwords (RFC 6238): the 6-digit codes from Google
// Authenticator, Microsoft Authenticator, 1Password and similar apps.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const STEP_SECONDS = 30
const DIGITS = 6

function base32Encode(bytes: Buffer) {
  let bits = 0
  let value = 0
  let out = ""
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(text: string) {
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of text.replace(/=+$/, "").toUpperCase()) {
    const index = ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

export const generateTotpSecret = () => base32Encode(randomBytes(20))

function codeAt(secret: string, counter: number) {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac("sha1", base32Decode(secret)).update(buf).digest()
  const offset = digest[digest.length - 1] & 0xf
  const binary = digest.readUInt32BE(offset) & 0x7fffffff
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0")
}

// Accepts the current code and one step either side (clock drift).
export function verifyTotp(secret: string, code: string, now = Date.now()) {
  const clean = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(clean)) return false
  const counter = Math.floor(now / 1000 / STEP_SECONDS)
  return [-1, 0, 1].some((drift) => {
    const expected = Buffer.from(codeAt(secret, counter + drift))
    return timingSafeEqual(expected, Buffer.from(clean))
  })
}

export function totpUri(secret: string, accountEmail: string) {
  const label = encodeURIComponent(`CodeMotive Admin:${accountEmail}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent("CodeMotive Admin")}&digits=${DIGITS}&period=${STEP_SECONDS}`
}

export const totpQrDataUrl = (uri: string) => QRCode.toDataURL(uri, { margin: 1, width: 220 })

// Exposed for tests.
export const _totpCodeAt = codeAt
