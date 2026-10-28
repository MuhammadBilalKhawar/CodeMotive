import { GoogleGenAI } from "@google/genai"
import { getEnv } from "@/lib/env"
import { siteConfig } from "@/config/site"
import type { Currency } from "@/lib/content-schema"
import { chatSystemPrompt, contactSystemPrompt, mockupSystemPrompt } from "@/lib/ai/prompt"
import { cleanReply, isReplySafe } from "@/lib/ai/safety"

export type ReplyKind = "contact" | "mockup"

export type ReplyRequest = {
  kind: ReplyKind
  firstName: string
  // What the visitor asked about, for the template ("Shopify / online store", or the business name).
  topic: string
  // Form fields sent to the model as JSON data (never as instructions).
  data: Record<string, unknown>
}

// Contact details for the fixed template reply.
export type TemplateSite = { whatsappUrl: string; mockupDays: number }
const defaultTemplateSite: TemplateSite = { whatsappUrl: siteConfig.whatsapp.url, mockupDays: 3 }

export type ReplyContext = {
  facts: string
  site?: TemplateSite
  allowedPrices: Record<Currency, Set<number>>
}

export type ReplySource = "groq" | "gemini" | "template"

export type ChatMessage = { role: "user" | "assistant"; content: string }

const TIMEOUT_MS = 8000
const TEMPERATURE = 0.3

export function templateReply({ kind, firstName, topic }: ReplyRequest, site: TemplateSite = defaultTemplateSite) {
  const whatsapp = site.whatsappUrl
  if (kind === "mockup") {
    const days = `${site.mockupDays} working day${site.mockupDays === 1 ? "" : "s"}`
    return `Thanks ${firstName}! We've received your free homepage mockup request for ${topic}. Bilal will personally review your details and email your mockup within ${days}. If it's urgent, message us on WhatsApp: ${whatsapp}`
  }
  return `Thanks ${firstName}! We've received your message about ${topic}. Bilal will personally review it and email you within 24 hours with next steps. If it's urgent, message us on WhatsApp: ${whatsapp}`
}

// Chat fallback when no provider gives a usable answer.
export const chatFallbackReply =
  "Sorry, I can't answer that right now. Bilal can help you directly: use the contact form for a fixed quote, or message us on WhatsApp. He replies within 24 hours."

// Reasoning models would spend the token budget thinking; keep it minimal.
function groqReasoningOptions(model: string) {
  if (model.startsWith("qwen/qwen3")) return { reasoning_effort: "none" }
  if (model.startsWith("openai/gpt-oss")) return { reasoning_effort: "low" }
  return {}
}

async function askGroq(system: string, messages: ChatMessage[]) {
  const env = getEnv()
  if (!env.GROQ_API_KEY) throw new Error("Groq not configured")
  const res = await fetch(`${env.GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      temperature: TEMPERATURE,
      max_completion_tokens: 450,
      ...groqReasoningOptions(env.GROQ_MODEL),
      messages: [{ role: "system", content: system }, ...messages],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? ""
}

async function askGemini(system: string, messages: ChatMessage[]) {
  const env = getEnv()
  if (!env.GEMINI_API_KEY) throw new Error("Gemini not configured")
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  const res = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    config: {
      systemInstruction: system,
      temperature: TEMPERATURE,
      // Headroom for models that think before answering; the reply itself is capped in cleanReply.
      maxOutputTokens: 1024,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    },
  })
  return res.text ?? ""
}

const providers: [Exclude<ReplySource, "template">, (system: string, messages: ChatMessage[]) => Promise<string>][] = [
  ["groq", askGroq],
  ["gemini", askGemini],
]

// Groq first, then Gemini. A reply is only used if it passes the price and
// percentage safety check; returns null when no provider gives a usable one.
async function askProviders(system: string, messages: ChatMessage[], context: ReplyContext, minLength: number) {
  for (const [name, ask] of providers) {
    try {
      const reply = cleanReply(await ask(system, messages))
      if (reply.length < minLength) throw new Error("Reply too short")
      if (!isReplySafe(reply, context.allowedPrices, context.facts)) {
        console.warn(`[ai] ${name} reply failed the price safety check, discarded`)
        continue
      }
      return { reply, source: name }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.endsWith("not configured")) console.error(`[ai] ${name} failed: ${message}`)
    }
  }
  return null
}

// Instant reply after the contact or mockup form; the fixed template if no provider works.
export async function generateReply(request: ReplyRequest, context: ReplyContext): Promise<{ reply: string; source: ReplySource }> {
  const system = request.kind === "mockup" ? mockupSystemPrompt(context.facts) : contactSystemPrompt(context.facts)
  const messages: ChatMessage[] = [{ role: "user", content: JSON.stringify(request.data, null, 2) }]
  return (await askProviders(system, messages, context, 40)) ?? { reply: templateReply(request, context.site), source: "template" }
}

// Next message in the site chat widget.
export async function generateChatReply(
  messages: ChatMessage[],
  context: ReplyContext,
  currency: Currency,
): Promise<{ reply: string; source: ReplySource }> {
  return (await askProviders(chatSystemPrompt(context.facts, currency), messages, context, 2)) ?? { reply: chatFallbackReply, source: "template" }
}
