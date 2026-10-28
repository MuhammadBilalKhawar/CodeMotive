import type { Currency } from "@/lib/content-schema"

const MAX_REPLY_CHARS = 1400

// Plain text only: drop markdown the model may add anyway.
export function cleanReply(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/(\*\*|__|\*|`)/g, "")
    .replace(/^\s{0,3}(#{1,6}|>|[-•]\s)\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_REPLY_CHARS)
    .trim()
}

const toNumber = (digits: string, suffix?: string) => {
  const value = Number(digits.replace(/,/g, ""))
  return /^(k|thousand)$/i.test(suffix ?? "") ? value * 1000 : value
}

// Finds every money amount in the reply, e.g. "PKR 35,000", "Rs. 35k",
// "35,000 rupees", "$299", "299 USD".
export function extractMoney(text: string) {
  const found: { currency: Currency; amount: number }[] = []
  const amount = String.raw`(\d[\d,]*(?:\.\d+)?)\s?(k|thousand)?\b`
  const patterns: [RegExp, Currency][] = [
    [new RegExp(String.raw`(?:\bPKR|\bRs\.?|₨)\s?${amount}`, "gi"), "PKR"],
    [new RegExp(String.raw`(\d[\d,]*(?:\.\d+)?)\s?(k|thousand)?\s?(?:PKR\b|rupees\b|روپے)`, "gi"), "PKR"],
    [new RegExp(String.raw`(?:US\$|\$|\bUSD)\s?${amount}`, "gi"), "USD"],
    [new RegExp(String.raw`(\d[\d,]*(?:\.\d+)?)\s?(k|thousand)?\s?(?:USD\b|dollars\b)`, "gi"), "USD"],
  ]
  for (const [regex, currency] of patterns) {
    for (const match of text.matchAll(regex)) found.push({ currency, amount: toNumber(match[1], match[2]) })
  }
  return found
}

// A reply is only used if every price in it is a published starting price for
// that currency, and every percentage appears in the company facts (e.g. the
// 50% payment split). This blocks invented prices and "90% off" style replies.
export function isReplySafe(reply: string, allowed: Record<Currency, Set<number>>, facts: string) {
  for (const { currency, amount } of extractMoney(reply)) {
    if (!allowed[currency].has(amount)) return false
  }
  const allowedPercents = new Set([...facts.matchAll(/(\d+(?:\.\d+)?)\s?%/g)].map((m) => m[1]))
  for (const match of reply.matchAll(/(\d+(?:\.\d+)?)\s?(?:%|percent)/gi)) {
    if (!allowedPercents.has(match[1])) return false
  }
  return true
}
