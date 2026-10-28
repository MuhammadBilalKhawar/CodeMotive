"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import type { z } from "zod"
import { isDbConfigured } from "@/lib/db"
import { isActionError, userForAction } from "@/lib/auth/current"
import type { AdminUser } from "@/lib/auth/users"
import { logActivity } from "@/lib/audit"
import { addTimeline } from "@/lib/crm/timeline"
import { pakistanDate } from "@/lib/crm/schemas"
import {
  addDays,
  billingSettingsSchema,
  invoiceInputSchema,
  money,
  paymentMethodLabels,
  paymentSchema,
  quoteInputSchema,
  splitTotal,
  type InvoiceInput,
} from "@/lib/billing/schemas"
import {
  addPayment,
  addReminder,
  createInvoice,
  createQuote,
  deleteInvoice,
  deleteQuote,
  getBillingSettings,
  getInvoice,
  getQuote,
  removePayment,
  saveBillingSettings,
  updateInvoice,
  updateQuote,
} from "@/lib/billing/store"
import { emailInvoice, emailQuote } from "@/lib/billing/send"
import { acceptQuote, declineQuote, markQuoteSent } from "@/lib/billing/workflow"
import type { ActionResult } from "@/app/admin/actions/types"

// Quotes (owners and members), invoices and billing settings (owners only).

const fieldLabels: Record<string, string> = {
  billTo: "For",
  items: "Lines",
  discount: "Discount",
  schedule: "Payments",
  validUntil: "Valid until",
  title: "Title",
  issueDate: "Issue date",
  dueDate: "Due date",
  notes: "Notes",
  amount: "Amount",
  date: "Date",
  reference: "Reference",
  businessName: "Business name",
  defaultSchedule: "Default payments",
}

const describe = (error: z.ZodError) =>
  error.issues
    .slice(0, 4)
    .map((issue) => {
      const [first, index, field] = issue.path
      const where = first === "items" && typeof index === "number" ? `Line ${index + 1}` : first === "billTo" ? `For › ${String(index)}` : fieldLabels[String(first)] ?? "Form"
      return `${where}${first === "items" && field ? ` (${String(field)})` : ""}: ${issue.message}`
    })
    .join("\n")

async function billingUser(role?: "owner") {
  const user = await userForAction(role)
  if (isActionError(user)) return user
  if (!isDbConfigured()) return { ok: false as const, error: "The database isn't connected." }
  return user
}

function refresh(...paths: string[]) {
  for (const path of ["/admin/quotes", "/admin/invoices", "/admin", ...paths]) revalidatePath(path)
}

const log = (user: AdminUser, action: string, entity: "quote" | "invoice" | "billing", entityId: string, summary: string) =>
  logActivity(user, { action, entity, entityId, summary: `${user.name} ${summary}` })

const deliveryError = (error: unknown) => {
  console.error("[billing] Email failed", error)
  return { ok: false as const, error: "The email couldn't be sent. Check Resend, or send the link yourself and use “Mark as sent”." }
}

// --- Settings ----------------------------------------------------------------

export async function saveBillingSettingsAction(input: unknown): Promise<ActionResult> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const parsed = billingSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  if (parsed.data.defaultSchedule.reduce((sum, i) => sum + i.percent, 0) !== 100) return { ok: false, error: "Default payments: they must add up to 100%" }
  await saveBillingSettings(parsed.data, user.name)
  await log(user, "saved", "billing", "billing", "updated the billing settings")
  revalidatePath("/admin/settings/billing")
  return { ok: true }
}

// --- Quotes ------------------------------------------------------------------

export async function createQuoteAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await billingUser()
  if ("ok" in user) return user
  const parsed = quoteInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  const id = await createQuote(parsed.data, user.name)
  const quote = await getQuote(id)
  await log(user, "created", "quote", id, `created quote ${quote?.number} for ${parsed.data.billTo.business || parsed.data.billTo.name}`)
  refresh()
  return { ok: true, data: { id } }
}

export async function updateQuoteAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await billingUser()
  if ("ok" in user) return user
  const quote = await getQuote(id)
  if (!quote) return { ok: false, error: "That quote no longer exists." }
  if (quote.status === "accepted" || quote.status === "declined") return { ok: false, error: "Accepted or declined quotes can't be changed. Duplicate it instead." }
  const parsed = quoteInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  await updateQuote(id, parsed.data)
  await log(user, "updated", "quote", id, `updated quote ${quote.number}`)
  refresh(`/admin/quotes/${id}`)
  return { ok: true }
}

// Emails the quote (with PDF) or just marks it sent, e.g. after sharing the link on WhatsApp.
export async function sendQuoteAction(id: string, viaEmail: boolean): Promise<ActionResult<{ emailed: boolean }>> {
  const user = await billingUser()
  if ("ok" in user) return user
  const quote = await getQuote(id)
  if (!quote) return { ok: false, error: "That quote no longer exists." }
  if (quote.status !== "draft" && quote.status !== "sent") return { ok: false, error: "This quote has already been decided." }
  let emailed = false
  if (viaEmail) {
    if (!quote.billTo.email) return { ok: false, error: "Add the client's email address first." }
    try {
      emailed = (await emailQuote(quote)) === "sent"
    } catch (error) {
      return deliveryError(error)
    }
    if (!emailed) return { ok: false, error: "Email is switched off (no RESEND_API_KEY). Copy the link and send it yourself, then use “Mark as sent”." }
  }
  await markQuoteSent(quote, user.name, emailed ? `by email to ${quote.billTo.email}` : "by link")
  await log(user, "sent", "quote", id, `sent quote ${quote.number}${emailed ? " by email" : ""}`)
  refresh(`/admin/quotes/${id}`, `/admin/leads/${quote.leadId}`)
  return { ok: true, data: { emailed } }
}

// The client said yes or no outside the link (WhatsApp, call).
export async function decideQuoteAction(id: string, decision: "accepted" | "declined", reason = ""): Promise<ActionResult> {
  const user = await billingUser()
  if ("ok" in user) return user
  const quote = await getQuote(id)
  if (!quote) return { ok: false, error: "That quote no longer exists." }
  if (quote.status === "accepted" || quote.status === "declined") return { ok: false, error: "This quote has already been decided." }
  if (decision === "accepted") await acceptQuote(quote, user.name, false)
  else await declineQuote(quote, user.name, reason.trim().slice(0, 300), false)
  await log(user, decision, "quote", id, `marked quote ${quote.number} ${decision}`)
  refresh(`/admin/quotes/${id}`, "/admin/leads", "/admin/clients")
  return { ok: true }
}

export async function duplicateQuoteAction(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await billingUser()
  if ("ok" in user) return user
  const quote = await getQuote(id)
  if (!quote) return { ok: false, error: "That quote no longer exists." }
  const settings = await getBillingSettings()
  const copyId = await createQuote(
    {
      clientId: quote.clientId,
      leadId: quote.leadId,
      billTo: quote.billTo,
      currency: quote.currency,
      items: quote.items,
      discount: quote.discount,
      notes: quote.notes,
      title: quote.title,
      schedule: quote.schedule,
      validUntil: addDays(pakistanDate(), settings.quoteValidDays),
    },
    user.name,
  )
  await log(user, "created", "quote", copyId, `copied quote ${quote.number}`)
  refresh()
  return { ok: true, data: { id: copyId } }
}

export async function deleteQuoteAction(id: string): Promise<ActionResult> {
  const user = await billingUser()
  if ("ok" in user) return user
  const quote = await getQuote(id)
  if (!quote) return { ok: true }
  if (quote.status !== "draft") return { ok: false, error: "Only drafts can be deleted." }
  await deleteQuote(id)
  await log(user, "deleted", "quote", id, `deleted draft quote ${quote.number}`)
  refresh()
  return { ok: true }
}

// One invoice per payment in the quote's schedule (deposit, balance, ...).
export async function invoiceFromQuoteAction(quoteId: string, installment: number): Promise<ActionResult<{ id: string }>> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const quote = await getQuote(quoteId)
  if (!quote) return { ok: false, error: "That quote no longer exists." }
  if (quote.status !== "accepted") return { ok: false, error: "Invoice a quote once it's accepted." }
  const existing = quote.invoiceIds[String(installment)]
  if (existing && (await getInvoice(existing))) return { ok: true, data: { id: existing } }
  const part = splitTotal(quote.total, quote.schedule)[installment]
  if (!part) return { ok: false, error: "Unknown payment." }

  const settings = await getBillingSettings()
  const today = pakistanDate()
  const input: InvoiceInput & { quoteId: string } = {
    quoteId,
    clientId: quote.clientId,
    leadId: quote.leadId,
    billTo: quote.billTo,
    currency: quote.currency,
    items: [
      {
        description: `${part.label} (${part.percent}%): ${quote.title}`.slice(0, 120),
        details: `Quote ${quote.number}, total ${money(quote.total, quote.currency)}: ${quote.items.map((i) => i.description).join(", ")}`.slice(0, 600),
        quantity: 1,
        unitPrice: part.amount,
      },
    ],
    discount: 0,
    notes: "",
    issueDate: today,
    dueDate: addDays(today, settings.invoiceDueDays),
  }
  const id = await createInvoice(input, user.name)
  await updateQuote(quoteId, { invoiceIds: { ...quote.invoiceIds, [String(installment)]: id } })
  await log(user, "created", "invoice", id, `created the ${part.label.toLowerCase()} invoice for quote ${quote.number}`)
  refresh(`/admin/quotes/${quoteId}`)
  return { ok: true, data: { id } }
}

// --- Invoices (owners) -------------------------------------------------------

export async function createInvoiceAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const parsed = invoiceInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  const id = await createInvoice(parsed.data, user.name)
  const invoice = await getInvoice(id)
  await log(user, "created", "invoice", id, `created invoice ${invoice?.number} for ${parsed.data.billTo.business || parsed.data.billTo.name}`)
  refresh()
  return { ok: true, data: { id } }
}

export async function updateInvoiceAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const invoice = await getInvoice(id)
  if (!invoice) return { ok: false, error: "That invoice no longer exists." }
  if (invoice.status === "void" || invoice.state === "paid") return { ok: false, error: "Paid or void invoices can't be changed." }
  const parsed = invoiceInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  await updateInvoice(id, parsed.data)
  await log(user, "updated", "invoice", id, `updated invoice ${invoice.number}`)
  refresh(`/admin/invoices/${id}`)
  return { ok: true }
}

export async function sendInvoiceAction(id: string, viaEmail: boolean): Promise<ActionResult<{ emailed: boolean }>> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const invoice = await getInvoice(id)
  if (!invoice) return { ok: false, error: "That invoice no longer exists." }
  if (invoice.status === "void") return { ok: false, error: "This invoice is void." }
  let emailed = false
  if (viaEmail) {
    if (!invoice.billTo.email) return { ok: false, error: "Add the client's email address first." }
    try {
      emailed = (await emailInvoice({ ...invoice, status: "sent" }, "invoice")) === "sent"
    } catch (error) {
      return deliveryError(error)
    }
    if (!emailed) return { ok: false, error: "Email is switched off (no RESEND_API_KEY). Copy the link and send it yourself, then use “Mark as sent”." }
  }
  await updateInvoice(id, { status: "sent", sentAt: new Date() })
  if (invoice.clientId) await addTimeline("client", invoice.clientId, { type: "system", text: `Invoice ${invoice.number} sent (${money(invoice.balance, invoice.currency)})`, by: user.name })
  await log(user, "sent", "invoice", id, `sent invoice ${invoice.number}${emailed ? " by email" : ""}`)
  refresh(`/admin/invoices/${id}`)
  return { ok: true, data: { emailed } }
}

export async function sendReminderAction(id: string): Promise<ActionResult> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const invoice = await getInvoice(id)
  if (!invoice) return { ok: false, error: "That invoice no longer exists." }
  if (invoice.status !== "sent" || invoice.balance === 0) return { ok: false, error: "Only sent invoices with money owed get reminders." }
  if (!invoice.billTo.email) return { ok: false, error: "Add the client's email address first." }
  try {
    if ((await emailInvoice(invoice, "reminder")) !== "sent") return { ok: false, error: "Email is switched off (no RESEND_API_KEY)." }
  } catch (error) {
    return deliveryError(error)
  }
  await addReminder(id, user.name)
  await log(user, "reminded", "invoice", id, `sent a payment reminder for invoice ${invoice.number}`)
  refresh(`/admin/invoices/${id}`)
  return { ok: true }
}

export async function recordPaymentAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const invoice = await getInvoice(id)
  if (!invoice) return { ok: false, error: "That invoice no longer exists." }
  if (invoice.status === "void") return { ok: false, error: "This invoice is void." }
  const parsed = paymentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  if (parsed.data.amount > invoice.balance) return { ok: false, error: `That's more than the ${money(invoice.balance, invoice.currency)} still owed.` }

  await addPayment(id, { ...parsed.data, id: randomUUID(), recordedBy: user.name, recordedAt: new Date() })
  // A payment means the invoice reached the client.
  if (invoice.status === "draft") await updateInvoice(id, { status: "sent" })
  const paidOff = parsed.data.amount === invoice.balance
  const text = `Payment of ${money(parsed.data.amount, invoice.currency)} for ${invoice.number} by ${paymentMethodLabels[parsed.data.method].toLowerCase()}${paidOff ? " (paid in full)" : ""}`
  if (invoice.clientId) await addTimeline("client", invoice.clientId, { type: "system", text, by: user.name })
  await log(user, "recorded", "invoice", id, `recorded a ${money(parsed.data.amount, invoice.currency)} payment for ${invoice.number}`)
  refresh(`/admin/invoices/${id}`)
  return { ok: true }
}

export async function removePaymentAction(id: string, paymentId: string): Promise<ActionResult> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const invoice = await getInvoice(id)
  const payment = invoice?.payments.find((p) => p.id === paymentId)
  if (!invoice || !payment) return { ok: false, error: "That payment no longer exists." }
  await removePayment(id, paymentId)
  await log(user, "removed", "invoice", id, `removed a ${money(payment.amount, invoice.currency)} payment from ${invoice.number}`)
  refresh(`/admin/invoices/${id}`)
  return { ok: true }
}

// Void keeps the number in sequence (for records); drafts can simply be deleted.
export async function voidInvoiceAction(id: string): Promise<ActionResult> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const invoice = await getInvoice(id)
  if (!invoice) return { ok: false, error: "That invoice no longer exists." }
  if (invoice.paid > 0) return { ok: false, error: "Remove the payments first." }
  await updateInvoice(id, { status: "void" })
  await log(user, "voided", "invoice", id, `voided invoice ${invoice.number}`)
  refresh(`/admin/invoices/${id}`)
  return { ok: true }
}

export async function deleteInvoiceAction(id: string): Promise<ActionResult> {
  const user = await billingUser("owner")
  if ("ok" in user) return user
  const invoice = await getInvoice(id)
  if (!invoice) return { ok: true }
  if (invoice.status !== "draft") return { ok: false, error: "Only drafts can be deleted; void a sent invoice instead." }
  await deleteInvoice(id)
  if (invoice.quoteId) {
    const quote = await getQuote(invoice.quoteId)
    if (quote) {
      const invoiceIds = Object.fromEntries(Object.entries(quote.invoiceIds).filter(([, value]) => value !== id))
      await updateQuote(quote.id, { invoiceIds })
    }
  }
  await log(user, "deleted", "invoice", id, `deleted draft invoice ${invoice.number}`)
  refresh()
  return { ok: true }
}
