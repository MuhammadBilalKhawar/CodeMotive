import { describe, expect, it } from "vitest"
import { change, chatReport, lastMonths, leadReport, moneyReport, quoteReport, type LeadRow } from "@/lib/reports/compute"
import { redact } from "@/lib/chat-questions"

const now = new Date("2026-10-28T07:00:00Z")
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)
const lead = (age: number, patch: Partial<LeadRow> = {}): LeadRow => ({ createdAt: daysAgo(age), source: "website", stage: "new", value: null, ...patch })

describe("lead report", () => {
  const leads = [
    lead(1, { stage: "won", source: "whatsapp", value: { amount: 85000, currency: "PKR" } }),
    lead(5, { stage: "lost" }),
    lead(10, { stage: "quoted", value: { amount: 90000, currency: "PKR" } }),
    lead(12, { stage: "contacted", source: "whatsapp", value: { amount: 900, currency: "USD" } }),
    lead(40),
    lead(45, { stage: "won" }),
    lead(200),
  ]
  const r = leadReport(leads, now, 30)

  it("counts the period and the one before", () => {
    expect(r.total).toBe(4)
    expect(r.previous).toBe(2)
    expect(change(r.total, r.previous)).toBe(1)
  })

  it("works out conversion and win rate", () => {
    expect(r.won).toBe(1)
    expect(r.conversion).toBe(0.25)
    expect(r.winRate).toBe(0.5)
  })

  it("sums open pipeline per currency, never mixing them", () => {
    expect(r.pipeline).toEqual({ PKR: 90000, USD: 900 })
  })

  it("ranks sources with their wins", () => {
    expect(r.bySource).toEqual([
      { source: "website", label: "Website form", total: 2, won: 0 },
      { source: "whatsapp", label: "WhatsApp", total: 2, won: 1 },
    ])
  })

  it("buckets 12 months in Pakistan time", () => {
    expect(r.byMonth).toHaveLength(12)
    expect(r.byMonth.at(-1)).toMatchObject({ key: "2026-10", value: 4 })
    expect(r.byMonth.reduce((s, m) => s + m.value, 0)).toBe(7)
    expect(lastMonths("2026-01-15", 3)).toEqual(["2025-11", "2025-12", "2026-01"])
  })
})

describe("quotes and money", () => {
  it("measures quote acceptance in the period", () => {
    const q = quoteReport(
      [
        { status: "accepted", currency: "PKR", total: 85000, sentAt: daysAgo(10), decidedAt: daysAgo(5) },
        { status: "declined", currency: "PKR", total: 50000, sentAt: daysAgo(8), decidedAt: daysAgo(2) },
        { status: "sent", currency: "USD", total: 900, sentAt: daysAgo(1) },
        { status: "accepted", currency: "USD", total: 700, sentAt: daysAgo(90), decidedAt: daysAgo(80) },
      ],
      now,
      30,
    )
    expect(q).toEqual({ sent: 3, accepted: 1, declined: 1, acceptance: 0.5, acceptedValue: { PKR: 85000, USD: 0 }, waiting: 1 })
  })

  it("adds payments by month and currency, owed, overdue and care plan income", () => {
    const m = moneyReport(
      [
        { status: "sent", state: "partial", currency: "PKR", balance: 22500, payments: [{ date: "2026-10-20", amount: 20000 }] },
        { status: "sent", state: "overdue", currency: "PKR", balance: 15000, payments: [] },
        { status: "sent", state: "paid", currency: "USD", balance: 0, payments: [{ date: "2026-09-02", amount: 450 }] },
        { status: "void", state: "void", currency: "PKR", balance: 9999, payments: [{ date: "2026-10-01", amount: 1 }] },
      ],
      [
        { status: "active", interval: "monthly", amount: 10000, currency: "PKR" },
        { status: "active", interval: "yearly", amount: 12000, currency: "PKR" },
        { status: "cancelled", interval: "monthly", amount: 49, currency: "USD" },
      ],
      "2026-10-28",
      30,
    )
    expect(m.received).toEqual({ PKR: 20000, USD: 0 })
    expect(m.outstanding).toEqual({ PKR: 37500, USD: 0 })
    expect(m.overdue).toEqual({ PKR: 15000, USD: 0 })
    expect(m.mrr).toEqual({ PKR: 11000, USD: 0 })
    expect(m.byMonth.PKR.at(-1)?.value).toBe(20000)
    expect(m.byMonth.USD.at(-2)?.value).toBe(450)
  })
})

describe("chat insights", () => {
  it("groups questions into topics, in English and Roman Urdu", () => {
    const at = new Date()
    const r = chatReport([
      { at, question: "How much does a website cost?", answered: true },
      { at, question: "website kitne ka banega?", answered: true },
      { at, question: "Can customers pay cash on delivery?", answered: true },
      { at, question: "Do you make android apps?", answered: false },
      { at, question: "Who won the cricket match?", answered: false },
      { at, question: "Do you do logos? Call me on [number] or [email]", answered: false },
    ])
    expect(r.topics).toEqual([
      { label: "Prices and cost", value: 2 },
      { label: "Other", value: 2 },
      { label: "Payments and COD", value: 1 },
      { label: "Mobile apps", value: 1 },
    ])
    expect(r.unansweredCount).toBe(3)
  })

  it("removes emails and phone numbers before storing", () => {
    expect(redact("Call me on +92 300 1234567 or ali@example.com please")).toBe("Call me on [number] or [email] please")
    expect(redact("I need 5 pages")).toBe("I need 5 pages")
    expect(redact("x".repeat(400))).toHaveLength(300)
  })
})
