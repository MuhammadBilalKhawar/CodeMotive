import { z } from "zod"
import { currencies } from "@/lib/crm/schemas"

// Client projects, care plans and renewals (domains, hosting...). No server
// imports, so the admin forms use the same checks as the server.

const tooLong = (max: number) => `Keep it to ${max} characters or fewer`
const optional = (max: number) => z.string().trim().max(max, tooLong(max))
const required = (max: number, message: string) => z.string().trim().min(1, message).max(max, tooLong(max))
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
const dateOrEmpty = z.union([z.literal(""), date])
const link = z.union([z.literal(""), z.string().trim().url("Use a full link starting with https://")])
const amount = z.number({ invalid_type_error: "Enter an amount" }).int("Whole numbers only").min(0, "Can't be negative").max(100_000_000)

// --- Projects ----------------------------------------------------------------

export const projectStages = ["planning", "design", "build", "review", "launched", "on-hold"] as const
export type ProjectStage = (typeof projectStages)[number]
export const projectStageLabels: Record<ProjectStage, string> = {
  planning: "Planning",
  design: "Design",
  build: "Build",
  review: "Client review",
  launched: "Launched",
  "on-hold": "On hold",
}
// Still being worked on (deadlines matter).
export const activeProjectStages: ProjectStage[] = ["planning", "design", "build", "review"]

export const projectKinds = ["website", "shopify", "other"] as const
export type ProjectKind = (typeof projectKinds)[number]
export const projectKindLabels: Record<ProjectKind, string> = { website: "Website", shopify: "Shopify store", other: "Other" }

// Starting checklist per kind; edited freely per project.
export const checklistTemplates: Record<ProjectKind, string[]> = {
  website: [
    "Deposit received",
    "Kick-off call, goals and pages agreed",
    "Content and logo received from the client",
    "Homepage design approved",
    "All pages built (mobile checked)",
    "Contact form, WhatsApp button and Google Maps tested",
    "Basic SEO: titles, descriptions, sitemap",
    "Speed check on a phone",
    "Client review and revisions done",
    "Balance invoice paid",
    "Domain connected, SSL working",
    "Launched and submitted to Google Search Console",
    "Handover call and handover pack sent",
  ],
  shopify: [
    "Deposit received",
    "Kick-off call, products and payment methods agreed",
    "Shopify plan and staff access set up",
    "Theme set up and branded",
    "Products uploaded with photos and variants",
    "Payments tested (COD / gateway)",
    "Shipping rates and courier set up",
    "Policies pages (refund, shipping, privacy)",
    "Test order placed end to end",
    "Client review and revisions done",
    "Balance invoice paid",
    "Domain connected, store launched",
    "Handover call and handover pack sent",
  ],
  other: ["Deposit received", "Kick-off call, scope agreed", "Work delivered", "Client review and revisions done", "Balance invoice paid", "Handover done"],
}

export const projectInputSchema = z.object({
  name: required(100, "Name the project"),
  clientId: required(40, "Pick a client"),
  quoteId: optional(40),
  kind: z.enum(projectKinds),
  stage: z.enum(projectStages),
  ownerId: optional(40),
  startDate: dateOrEmpty,
  dueDate: dateOrEmpty,
  links: z.object({ live: link, staging: link, jira: link, repo: link, design: link }),
  notes: optional(5000),
  // Printed in the handover pack: logins handed over, how to update, etc. Never passwords.
  handoverNotes: optional(5000),
})
export type ProjectInput = z.infer<typeof projectInputSchema>

export const checklistItemSchema = z.object({ text: required(200, "Write the task") })

export const expenseCategories = ["domain", "hosting", "app", "freelancer", "ads", "other"] as const
export type ExpenseCategory = (typeof expenseCategories)[number]
export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  domain: "Domain",
  hosting: "Hosting",
  app: "App / plugin / theme",
  freelancer: "Freelancer",
  ads: "Ads",
  other: "Other",
}
export const expenseSchema = z.object({
  date,
  description: required(120, "What was it for?"),
  category: z.enum(expenseCategories),
  amount: amount.min(1, "Enter the amount"),
  currency: z.enum(currencies),
})
export type ExpenseInput = z.infer<typeof expenseSchema>

// --- Care plans --------------------------------------------------------------

export const carePlanStatuses = ["active", "paused", "cancelled"] as const
export type CarePlanStatus = (typeof carePlanStatuses)[number]

export const carePlanInputSchema = z.object({
  clientId: required(40, "Pick a client"),
  projectId: optional(40),
  name: required(80, "Name the plan"),
  // What the monthly invoice line says is included.
  description: optional(600),
  amount: amount.min(1, "Enter the price"),
  currency: z.enum(currencies),
  interval: z.enum(["monthly", "yearly"]),
  nextInvoiceOn: date,
  status: z.enum(carePlanStatuses),
  // "draft": the invoice waits for you to check and send; "send": emailed automatically.
  invoiceMode: z.enum(["draft", "send"]),
})
export type CarePlanInput = z.infer<typeof carePlanInputSchema>

// --- Renewals ----------------------------------------------------------------

export const renewalKinds = ["domain", "hosting", "ssl", "email", "subscription", "other"] as const
export type RenewalKind = (typeof renewalKinds)[number]
export const renewalKindLabels: Record<RenewalKind, string> = {
  domain: "Domain",
  hosting: "Hosting",
  ssl: "SSL certificate",
  email: "Email hosting",
  subscription: "App / subscription",
  other: "Other",
}

export const renewalInputSchema = z.object({
  clientId: optional(40),
  projectId: optional(40),
  kind: z.enum(renewalKinds),
  // e.g. "khanbakers.com" or "Hostinger Business plan"
  name: required(120, "What renews?"),
  provider: optional(80),
  renewsOn: date,
  cost: z.number().int().min(0).max(100_000_000).nullable(),
  currency: z.enum(currencies),
  // Who pays the provider: the client directly, or us (then we bill them).
  paidBy: z.enum(["client", "us"]),
  autoRenew: z.boolean(),
  notes: optional(1000),
})
export type RenewalInput = z.infer<typeof renewalInputSchema>

// --- Dates -------------------------------------------------------------------

// Whole days from `today` to `date` (both "YYYY-MM-DD"); negative when past.
export const daysUntil = (dateText: string, today: string) => Math.round((Date.parse(dateText) - Date.parse(today)) / 86_400_000)

// Next billing date after `dateText` (same day next month/year, clamped to month end).
export function nextPeriod(dateText: string, interval: "monthly" | "yearly") {
  const [y, m, d] = dateText.split("-").map(Number)
  const year = interval === "yearly" ? y + 1 : m === 12 ? y + 1 : y
  const month = interval === "yearly" ? m : m === 12 ? 1 : m + 1
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`
}

// "2026-11-05" -> "November 2026", the period an invoice covers.
export const periodLabel = (dateText: string, interval: "monthly" | "yearly") =>
  interval === "yearly"
    ? `${dateText.slice(0, 4)}–${Number(dateText.slice(0, 4)) + 1}`
    : new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateText}T00:00:00Z`))

// Days before a renewal when the digest mentions it (and every day once overdue).
export const renewalAlertDays = [30, 14, 7, 3, 1, 0]
