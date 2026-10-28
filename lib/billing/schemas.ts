import { z } from "zod"
import { currencies } from "@/lib/crm/schemas"

// Quotes and invoices: shapes, totals and labels. No server imports, so the
// admin editors use the same checks and maths as the server.
// Amounts are whole numbers in the document's currency (rupees or dollars).

const tooLong = (max: number) => `Keep it to ${max} characters or fewer`
const optional = (max: number) => z.string().trim().max(max, tooLong(max))
const required = (max: number, message: string) => z.string().trim().min(1, message).max(max, tooLong(max))
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
const amount = z.number({ invalid_type_error: "Enter an amount" }).int("Whole numbers only").min(0, "Can't be negative").max(100_000_000)

export const lineItemSchema = z.object({
  description: required(120, "Every line needs a description"),
  details: optional(600),
  quantity: z.number({ invalid_type_error: "Enter a quantity" }).int("Whole numbers only").min(1, "At least 1").max(999),
  unitPrice: amount,
})
export type LineItem = z.infer<typeof lineItemSchema>

export const billToSchema = z.object({
  name: required(100, "Who is it for?"),
  business: optional(120),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address")]),
  address: optional(300),
})
export type BillTo = z.infer<typeof billToSchema>

// How the total is paid, e.g. 50% deposit + 50% on delivery.
export const installmentSchema = z.object({ label: required(60, "Name each payment"), percent: z.number().int().min(1).max(100) })
export type Installment = z.infer<typeof installmentSchema>

const documentFields = {
  clientId: optional(40),
  leadId: optional(40),
  billTo: billToSchema,
  currency: z.enum(currencies),
  items: z.array(lineItemSchema).min(1, "Add at least one line").max(30, "Up to 30 lines"),
  discount: amount,
  notes: optional(3000),
}

export const quoteInputSchema = z
  .object({
    ...documentFields,
    title: required(100, "Give the quote a title"),
    validUntil: date,
    schedule: z.array(installmentSchema).min(1).max(4),
  })
  .refine((q) => q.schedule.reduce((sum, i) => sum + i.percent, 0) === 100, { message: "The payments must add up to 100%", path: ["schedule"] })
  .refine((q) => q.discount <= subtotal(q.items), { message: "The discount is bigger than the subtotal", path: ["discount"] })
export type QuoteInput = z.infer<typeof quoteInputSchema>

export const invoiceInputSchema = z
  .object({
    ...documentFields,
    issueDate: date,
    dueDate: date,
  })
  .refine((i) => i.dueDate >= i.issueDate, { message: "The due date is before the issue date", path: ["dueDate"] })
  .refine((i) => i.discount <= subtotal(i.items), { message: "The discount is bigger than the subtotal", path: ["discount"] })
export type InvoiceInput = z.infer<typeof invoiceInputSchema>

export const paymentMethods = ["bank", "jazzcash", "easypaisa", "payoneer", "wise", "cash", "other"] as const
export type PaymentMethod = (typeof paymentMethods)[number]
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  bank: "Bank transfer",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  payoneer: "Payoneer",
  wise: "Wise",
  cash: "Cash",
  other: "Other",
}

export const paymentSchema = z.object({
  date,
  amount: amount.min(1, "Enter the amount received"),
  method: z.enum(paymentMethods),
  reference: optional(120),
})
export type PaymentInput = z.infer<typeof paymentSchema>

// Owner-only settings printed on quotes and invoices.
export const billingSettingsSchema = z.object({
  businessName: required(100, "Enter the business name"),
  // Lines under the name: address, email, phone.
  details: optional(400),
  pkrInstructions: optional(1000),
  usdInstructions: optional(1000),
  quoteValidDays: z.number().int().min(1).max(180),
  invoiceDueDays: z.number().int().min(0).max(120),
  defaultSchedule: z.array(installmentSchema).min(1).max(4),
  quoteTerms: optional(3000),
  invoiceFooter: optional(500),
  // Email clients automatically when an invoice is overdue (3 and 10 days late).
  autoReminders: z.boolean(),
})
export type BillingSettings = z.infer<typeof billingSettingsSchema>

export const quoteStatuses = ["draft", "sent", "accepted", "declined"] as const
export type QuoteStatus = (typeof quoteStatuses)[number]
export const quoteStatusLabels: Record<QuoteStatus | "expired", string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
}

export type InvoiceState = "draft" | "unpaid" | "partial" | "paid" | "overdue" | "void"
export const invoiceStateLabels: Record<InvoiceState, string> = {
  draft: "Draft",
  unpaid: "Unpaid",
  partial: "Part paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
}

// --- Maths -------------------------------------------------------------------

export const lineTotal = (item: Pick<LineItem, "quantity" | "unitPrice">) => item.quantity * item.unitPrice
export const subtotal = (items: Pick<LineItem, "quantity" | "unitPrice">[]) => items.reduce((sum, item) => sum + lineTotal(item), 0)
export const documentTotal = (doc: { items: Pick<LineItem, "quantity" | "unitPrice">[]; discount: number }) => Math.max(0, subtotal(doc.items) - doc.discount)

// Splits a total into installments; rounding goes to the last one so they add up exactly.
export function splitTotal(total: number, schedule: Installment[]) {
  let given = 0
  return schedule.map((installment, i) => {
    const part = i === schedule.length - 1 ? total - given : Math.round((total * installment.percent) / 100)
    given += part
    return { ...installment, amount: part }
  })
}

export function invoiceState(invoice: { status: "draft" | "sent" | "void"; dueDate: string; total: number; paid: number }, today: string): InvoiceState {
  if (invoice.status === "void") return "void"
  if (invoice.status === "draft") return "draft"
  if (invoice.paid >= invoice.total) return "paid"
  if (invoice.dueDate < today) return "overdue"
  return invoice.paid > 0 ? "partial" : "unpaid"
}

export const money = (amount: number, currency: (typeof currencies)[number]) =>
  currency === "PKR" ? `Rs ${amount.toLocaleString("en-PK")}` : `$${amount.toLocaleString("en-US")}`

// "2026-10-27" + 14 days, as a date string.
export function addDays(dateText: string, days: number) {
  const d = new Date(`${dateText}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// "2026-10-27" -> "27 Oct 2026"
export const longDate = (dateText: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateText}T00:00:00Z`))
