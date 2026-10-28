"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { isRateLimited } from "@/lib/rate-limit"
import { getQuoteByToken } from "@/lib/billing/store"
import { acceptQuote, declineQuote } from "@/lib/billing/workflow"
import { logActivity } from "@/lib/audit"

// The client's answer on their quote link. No sign-in: the link itself is the key.

type Result = { ok: true } | { ok: false; error: string }

const acceptSchema = z.object({
  name: z.string().trim().min(2, "Type your full name to accept").max(100),
  agree: z.literal(true, { errorMap: () => ({ message: "Tick the box to confirm" }) }),
})

async function openQuote(token: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (await isRateLimited(`quote-answer:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 })) return { error: "Too many tries. Please wait a while, or reply to our email." }
  const quote = await getQuoteByToken(token)
  if (!quote) return { error: "This quote link isn't valid any more." }
  if (quote.status === "accepted" || quote.status === "declined") return { error: "This quote has already been answered." }
  if (quote.status !== "sent") return { error: "This quote isn't ready yet." }
  if (quote.expired) return { error: "This quote has expired. Reply to our email and we'll send an updated one." }
  return { quote }
}

export async function acceptQuoteByClient(token: string, input: unknown): Promise<Result> {
  const parsed = acceptSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const { quote, error } = await openQuote(token)
  if (!quote) return { ok: false, error }
  await acceptQuote(quote, parsed.data.name, true)
  await logActivity(null, { action: "accepted", entity: "quote", entityId: quote.id, summary: `${parsed.data.name} accepted quote ${quote.number} online` })
  revalidatePath(`/quote/${token}`)
  return { ok: true }
}

export async function declineQuoteByClient(token: string, reason: string): Promise<Result> {
  const { quote, error } = await openQuote(token)
  if (!quote) return { ok: false, error }
  await declineQuote(quote, quote.billTo.name, String(reason ?? "").trim().slice(0, 300), true)
  await logActivity(null, { action: "declined", entity: "quote", entityId: quote.id, summary: `${quote.billTo.name} declined quote ${quote.number} online` })
  revalidatePath(`/quote/${token}`)
  return { ok: true }
}
