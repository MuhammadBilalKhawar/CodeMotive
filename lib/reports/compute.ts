import { openStages, pakistanDate, sourceLabels, sources, stages, type Source, type Stage } from "@/lib/crm/schemas"

// Numbers for the dashboard and reports. Pure functions over plain records,
// so every figure can be tested without a database. Money is never added
// across currencies: each total is per currency.

export type Currency = "PKR" | "USD"
export type PerCurrency = Record<Currency, number>
const zero = (): PerCurrency => ({ PKR: 0, USD: 0 })

export type LeadRow = { createdAt: Date; source: Source; stage: Stage; value: { amount: number; currency: Currency } | null }
export type QuoteRow = { status: "draft" | "sent" | "accepted" | "declined"; currency: Currency; total: number; sentAt?: Date; decidedAt?: Date }
export type InvoiceRow = { status: "draft" | "sent" | "void"; state: string; currency: Currency; balance: number; payments: { date: string; amount: number }[] }
export type PlanRow = { status: string; interval: "monthly" | "yearly"; amount: number; currency: Currency }
export type QuestionRow = { at: Date; question: string; answered: boolean }

// "YYYY-MM" for the last `count` months in Pakistan time, oldest first.
export function lastMonths(today: string, count = 12) {
  const [y, m] = today.split("-").map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1))
    return d.toISOString().slice(0, 7)
  })
}

export const monthLabel = (key: string) => new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`))

const monthOf = (date: Date) => pakistanDate(date).slice(0, 7)

// Leads, conversion and pipeline for a period of `days` ending today.
export function leadReport(leads: LeadRow[], now: Date, days: number) {
  const start = new Date(now.getTime() - days * 86_400_000)
  const previousStart = new Date(start.getTime() - days * 86_400_000)
  const inPeriod = leads.filter((l) => l.createdAt >= start && l.createdAt <= now)
  const previous = leads.filter((l) => l.createdAt >= previousStart && l.createdAt < start).length
  const won = inPeriod.filter((l) => l.stage === "won").length
  const lost = inPeriod.filter((l) => l.stage === "lost").length

  const pipeline = zero()
  for (const lead of leads) if (openStages.includes(lead.stage) && lead.value) pipeline[lead.value.currency] += lead.value.amount

  const bySource = sources
    .map((source) => {
      const rows = inPeriod.filter((l) => l.source === source)
      return { source, label: sourceLabels[source], total: rows.length, won: rows.filter((l) => l.stage === "won").length }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)

  const months = lastMonths(pakistanDate(now))
  const byMonth = months.map((key) => ({ key, label: monthLabel(key), value: leads.filter((l) => monthOf(l.createdAt) === key).length }))

  return {
    total: inPeriod.length,
    previous,
    won,
    lost,
    // Of the leads that were decided, how many we won.
    winRate: won + lost > 0 ? won / (won + lost) : null,
    // Of all leads in the period, how many became clients.
    conversion: inPeriod.length > 0 ? won / inPeriod.length : null,
    stageCounts: stages.map((stage) => ({ stage, count: inPeriod.filter((l) => l.stage === stage).length })),
    pipeline,
    openCount: leads.filter((l) => openStages.includes(l.stage)).length,
    bySource,
    byMonth,
  }
}

export function quoteReport(quotes: QuoteRow[], now: Date, days: number) {
  const start = new Date(now.getTime() - days * 86_400_000)
  const sent = quotes.filter((q) => q.sentAt && q.sentAt >= start).length
  const decided = quotes.filter((q) => q.decidedAt && q.decidedAt >= start)
  const accepted = decided.filter((q) => q.status === "accepted")
  const acceptedValue = zero()
  for (const q of accepted) acceptedValue[q.currency] += q.total
  return {
    sent,
    accepted: accepted.length,
    declined: decided.length - accepted.length,
    acceptance: decided.length > 0 ? accepted.length / decided.length : null,
    acceptedValue,
    waiting: quotes.filter((q) => q.status === "sent").length,
  }
}

export function moneyReport(invoices: InvoiceRow[], plans: PlanRow[], today: string, days: number) {
  const startDate = pakistanDate(new Date(Date.parse(`${today}T12:00:00Z`) - days * 86_400_000))
  const months = lastMonths(today)
  const byMonth: Record<Currency, { key: string; label: string; value: number }[]> = {
    PKR: months.map((key) => ({ key, label: monthLabel(key), value: 0 })),
    USD: months.map((key) => ({ key, label: monthLabel(key), value: 0 })),
  }
  const received = zero()
  const outstanding = zero()
  const overdue = zero()
  for (const invoice of invoices) {
    if (invoice.status === "void") continue
    for (const p of invoice.payments) {
      const slot = byMonth[invoice.currency].find((m) => m.key === p.date.slice(0, 7))
      if (slot) slot.value += p.amount
      if (p.date > startDate && p.date <= today) received[invoice.currency] += p.amount
    }
    if (invoice.status === "sent") {
      outstanding[invoice.currency] += invoice.balance
      if (invoice.state === "overdue") overdue[invoice.currency] += invoice.balance
    }
  }
  const mrr = zero()
  for (const plan of plans) if (plan.status === "active") mrr[plan.currency] += plan.interval === "yearly" ? plan.amount / 12 : plan.amount
  mrr.PKR = Math.round(mrr.PKR)
  mrr.USD = Math.round(mrr.USD)
  return { byMonth, received, outstanding, overdue, mrr }
}

// Rough topics for chat questions (English and Roman Urdu). First match wins.
export const chatTopics: [string, RegExp][] = [
  ["Prices and cost", /price|cost|kitn[ae]|rate|charges?|budget|paise|rupees?|\brs\b|\$|pkr|usd|kharcha|fee/i],
  ["Timeline", /how long|kitn[ae] (din|time)|kab tak|days?|weeks?|deadline|time lag|jaldi|fast/i],
  ["Shopify and online stores", /shopify|store|e-?commerce|products?|daraz|woo/i],
  ["Payments and COD", /pay(ment)?|cod|cash on delivery|jazz ?cash|easy ?paisa|installments?|advance|bank/i],
  ["Domain, hosting and SEO", /domain|hosting|seo|google|rank|ssl|email/i],
  ["Mobile apps", /\bapps?\b|android|ios|play ?store|app ?store/i],
  ["Changes and support", /update|change|edit|support|maintenance|care plan|fix/i],
]

export function chatReport(questions: QuestionRow[]) {
  const counts = new Map<string, number>()
  for (const q of questions) {
    // The [email] / [number] placeholders from redaction aren't topics.
    const text = q.question.replace(/\[(email|number)\]/g, "")
    const topic = chatTopics.find(([, pattern]) => pattern.test(text))?.[0] ?? "Other"
    counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }
  const topics = [...chatTopics.map(([name]) => name), "Other"].map((name) => ({ label: name, value: counts.get(name) ?? 0 })).filter((t) => t.value > 0).sort((a, b) => b.value - a.value)
  return {
    total: questions.length,
    unansweredCount: questions.filter((q) => !q.answered).length,
    topics,
    unanswered: questions.filter((q) => !q.answered).slice(0, 25),
    recent: questions.slice(0, 25),
  }
}

// Change against the previous period, e.g. +25%. null when there's nothing to compare.
export const change = (current: number, previous: number) => (previous > 0 ? (current - previous) / previous : null)
