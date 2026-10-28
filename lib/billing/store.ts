import { randomBytes } from "node:crypto"
import { cache } from "react"
import { ObjectId, type Filter } from "mongodb"
import { getDb, isDbConfigured } from "@/lib/db"
import { readContent, writeContent } from "@/lib/content"
import {
  billingSettingsSchema,
  documentTotal,
  invoiceState,
  type BillingSettings,
  type InvoiceInput,
  type PaymentInput,
  type QuoteInput,
  type QuoteStatus,
} from "@/lib/billing/schemas"
import { pakistanDate } from "@/lib/crm/schemas"

// Quotes, invoices and the billing settings printed on them.

export const defaultBillingSettings: BillingSettings = {
  businessName: "CodeMotive",
  details: "Lahore, Pakistan\nadmin@code-motive.dev\n+92 326 5152747\ncode-motive.dev",
  pkrInstructions: "",
  usdInstructions: "",
  quoteValidDays: 14,
  invoiceDueDays: 7,
  defaultSchedule: [
    { label: "Deposit to start", percent: 50 },
    { label: "Balance on delivery", percent: 50 },
  ],
  quoteTerms:
    "Work starts once the deposit is received.\nThe price covers the scope above; anything extra is quoted before we do it.\nThe website, its content and your domain are yours once the project is paid in full.\nThird-party costs (domain, hosting plans, Shopify subscription, paid apps) are paid directly to those providers.",
  invoiceFooter: "Thank you for working with CodeMotive.",
  autoReminders: false,
}

export const getBillingSettings = cache(() => readContent("billing", billingSettingsSchema, defaultBillingSettings))
export const saveBillingSettings = (settings: BillingSettings, savedBy: string) => writeContent("billing", settings, savedBy, defaultBillingSettings)

// Hard-to-guess id for the client's link (/quote/…, /invoice/…).
const newToken = () => randomBytes(18).toString("base64url")

// Q-2026-001, INV-2026-001: one counter per kind and year.
async function nextNumber(kind: "Q" | "INV") {
  const year = pakistanDate().slice(0, 4)
  const counter = await (await getDb())
    .collection<{ _id: string; seq: number }>("counters")
    .findOneAndUpdate({ _id: `${kind}-${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" })
  return `${kind}-${year}-${String(counter?.seq ?? 1).padStart(3, "0")}`
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const byId = (id: string) => ({ _id: new ObjectId(id) })

// --- Quotes ------------------------------------------------------------------

type QuoteDoc = QuoteInput & {
  number: string
  status: QuoteStatus
  token: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  sentAt?: Date
  viewedAt?: Date
  // Name typed by the client when accepting, or the admin who marked it.
  decidedBy?: string
  decidedAt?: Date
  declineReason?: string
  // Invoice per installment index, once created.
  invoiceIds: Record<string, string>
}

export type Quote = QuoteDoc & { id: string; total: number; expired: boolean }

const quotes = async () => (await getDb()).collection<QuoteDoc>("quotes")

function toQuote({ _id, ...doc }: QuoteDoc & { _id: ObjectId }): Quote {
  return { ...doc, id: _id.toString(), total: documentTotal(doc), expired: doc.status === "sent" && doc.validUntil < pakistanDate() }
}

export async function listQuotes({ status, q, clientId, leadId }: { status?: QuoteStatus; q?: string; clientId?: string; leadId?: string } = {}) {
  if (!isDbConfigured()) return []
  const and: Filter<QuoteDoc>[] = []
  if (status) and.push({ status })
  if (clientId) and.push({ clientId })
  if (leadId) and.push({ leadId })
  if (q?.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), "i")
    and.push({ $or: [{ number: pattern }, { title: pattern }, { "billTo.name": pattern }, { "billTo.business": pattern }] })
  }
  const docs = await (await quotes()).find(and.length ? { $and: and } : {}).sort({ createdAt: -1 }).limit(500).toArray()
  return docs.map(toQuote)
}

export async function getQuote(id: string) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null
  const doc = await (await quotes()).findOne(byId(id))
  return doc ? toQuote(doc) : null
}

export async function getQuoteByToken(token: string) {
  if (!isDbConfigured() || !/^[\w-]{20,40}$/.test(token)) return null
  const doc = await (await quotes()).findOne({ token })
  return doc ? toQuote(doc) : null
}

export async function createQuote(input: QuoteInput, createdBy: string) {
  const now = new Date()
  const doc: QuoteDoc = { ...input, number: await nextNumber("Q"), status: "draft", token: newToken(), createdAt: now, updatedAt: now, createdBy, invoiceIds: {} }
  const result = await (await quotes()).insertOne(doc)
  return result.insertedId.toString()
}

export async function updateQuote(id: string, patch: Partial<QuoteDoc>) {
  await (await quotes()).updateOne(byId(id), { $set: { ...patch, updatedAt: new Date() } })
}

export async function deleteQuote(id: string) {
  await (await quotes()).deleteOne(byId(id))
}

// --- Invoices ----------------------------------------------------------------

export type Payment = PaymentInput & { id: string; recordedBy: string; recordedAt: Date }

type InvoiceDoc = InvoiceInput & {
  number: string
  status: "draft" | "sent" | "void"
  token: string
  quoteId?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  sentAt?: Date
  viewedAt?: Date
  payments: Payment[]
  // When reminders were emailed (by hand or automatically).
  reminders: { at: Date; by: string }[]
}

export type Invoice = InvoiceDoc & { id: string; total: number; paid: number; balance: number; state: ReturnType<typeof invoiceState> }

const invoices = async () => (await getDb()).collection<InvoiceDoc>("invoices")

function toInvoice({ _id, ...doc }: InvoiceDoc & { _id: ObjectId }, today = pakistanDate()): Invoice {
  const total = documentTotal(doc)
  const paid = doc.payments.reduce((sum, p) => sum + p.amount, 0)
  return { ...doc, id: _id.toString(), total, paid, balance: Math.max(0, total - paid), state: invoiceState({ status: doc.status, dueDate: doc.dueDate, total, paid }, today) }
}

export async function listInvoices({ q, clientId, quoteId }: { q?: string; clientId?: string; quoteId?: string } = {}) {
  if (!isDbConfigured()) return []
  const and: Filter<InvoiceDoc>[] = []
  if (clientId) and.push({ clientId })
  if (quoteId) and.push({ quoteId })
  if (q?.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), "i")
    and.push({ $or: [{ number: pattern }, { "billTo.name": pattern }, { "billTo.business": pattern }] })
  }
  const today = pakistanDate()
  const docs = await (await invoices()).find(and.length ? { $and: and } : {}).sort({ createdAt: -1 }).limit(500).toArray()
  return docs.map((doc) => toInvoice(doc, today))
}

export async function getInvoice(id: string) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null
  const doc = await (await invoices()).findOne(byId(id))
  return doc ? toInvoice(doc) : null
}

export async function getInvoiceByToken(token: string) {
  if (!isDbConfigured() || !/^[\w-]{20,40}$/.test(token)) return null
  const doc = await (await invoices()).findOne({ token })
  return doc ? toInvoice(doc) : null
}

export async function createInvoice(input: InvoiceInput & { quoteId?: string }, createdBy: string) {
  const now = new Date()
  const doc: InvoiceDoc = { ...input, number: await nextNumber("INV"), status: "draft", token: newToken(), createdAt: now, updatedAt: now, createdBy, payments: [], reminders: [] }
  const result = await (await invoices()).insertOne(doc)
  return result.insertedId.toString()
}

export async function updateInvoice(id: string, patch: Partial<InvoiceDoc>) {
  await (await invoices()).updateOne(byId(id), { $set: { ...patch, updatedAt: new Date() } })
}

export async function addPayment(id: string, payment: Payment) {
  await (await invoices()).updateOne(byId(id), { $push: { payments: payment }, $set: { updatedAt: new Date() } })
}

export async function removePayment(id: string, paymentId: string) {
  await (await invoices()).updateOne(byId(id), { $pull: { payments: { id: paymentId } }, $set: { updatedAt: new Date() } })
}

export async function addReminder(id: string, by: string) {
  await (await invoices()).updateOne(byId(id), { $push: { reminders: { at: new Date(), by } } })
}

export async function deleteInvoice(id: string) {
  await (await invoices()).deleteOne(byId(id))
}

// Sent invoices with money still owed (for the digest and reminders).
export async function openInvoices() {
  if (!isDbConfigured()) return []
  const today = pakistanDate()
  const docs = await (await invoices()).find({ status: "sent" }).sort({ dueDate: 1 }).limit(500).toArray()
  return docs.map((doc) => toInvoice(doc, today)).filter((invoice) => invoice.balance > 0)
}
