import { getDb, isDbConfigured } from "@/lib/db"

// What visitors ask the chat widget, so the team can see common questions and
// the ones the AI couldn't answer. Only the question text is kept (no name, IP
// or conversation), emails and phone numbers are removed, and MongoDB deletes
// each entry after 90 days. Described in the privacy policy.

const RETENTION_DAYS = 90

type ChatQuestionDoc = { at: Date; question: string; answered: boolean }

let indexReady: Promise<unknown> | null = null
async function questions() {
  const collection = (await getDb()).collection<ChatQuestionDoc>("chat_questions")
  indexReady ??= collection.createIndex({ at: 1 }, { expireAfterSeconds: RETENTION_DAYS * 86_400 })
  await indexReady
  return collection
}

// Strips contact details a visitor may have typed.
export const redact = (text: string) =>
  text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300)

export async function saveChatQuestion(question: string, answered: boolean) {
  if (!isDbConfigured()) return
  const text = redact(question)
  if (!text) return
  await (await questions()).insertOne({ at: new Date(), question: text, answered })
}

export async function listChatQuestions(since: Date) {
  if (!isDbConfigured()) return []
  const docs = await (await questions()).find({ at: { $gte: since } }).sort({ at: -1 }).limit(2000).toArray()
  return docs.map(({ _id, ...doc }) => ({ id: _id.toString(), ...doc }))
}
