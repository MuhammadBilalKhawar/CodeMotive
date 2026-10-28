import { z } from "zod"
import { chatFallbackReply, generateChatReply } from "@/lib/ai/generateReply"
import { jsonError, loadReplyContext } from "@/lib/lead-pipeline"
import { getAiSettings } from "@/lib/cms"
import { saveChatQuestion } from "@/lib/chat-questions"
import { isRateLimited } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-info"

export const runtime = "nodejs"

// Site chat widget. Answers from the company facts only (same safety check as
// the form replies). Conversations aren't stored; only each question, without
// contact details, for the admin's chat insights (see lib/chat-questions.ts).

const MAX_TURNS_SENT = 12
const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(600) }))
    .min(1)
    .max(20)
    .refine((m) => m.length > 0 && m[m.length - 1].role === "user", "The last message must be from the visitor"),
  currency: z.enum(["PKR", "USD"]).default("USD"),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, "Invalid request.")
  }

  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, "Please keep messages under 600 characters.")

  if (await isRateLimited(`chat:${getClientIp(request)}`, RATE_LIMIT)) {
    return jsonError(429, "You've sent a lot of messages in a short time. Please wait a few minutes, or message us on WhatsApp.")
  }

  if (!(await getAiSettings().catch(() => null))?.chatEnabled) return jsonError(503, "The chat is switched off right now. Please use the contact form or WhatsApp.")

  const context = await loadReplyContext()
  if (!context) return Response.json({ ok: true, reply: chatFallbackReply })

  const messages = parsed.data.messages.slice(-MAX_TURNS_SENT)
  const { reply, source } = await generateChatReply(messages, context, parsed.data.currency)
  // "template" means no AI answer passed the safety check: worth a look in the admin.
  await saveChatQuestion(messages[messages.length - 1].content, source !== "template").catch((error) => console.error("[chat] Couldn't save the question", error))
  return Response.json({ ok: true, reply })
}
