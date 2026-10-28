import { describe, expect, it } from "vitest"
import {
  addDays,
  documentTotal,
  invoiceInputSchema,
  invoiceState,
  money,
  paymentSchema,
  quoteInputSchema,
  splitTotal,
  type QuoteInput,
} from "@/lib/billing/schemas"
import { defaultBillingSettings } from "@/lib/billing/store"
import { billingSettingsSchema } from "@/lib/billing/schemas"
import { invoicePdf, quotePdf } from "@/lib/billing/pdf"
import { overdueInvoiceRows } from "@/lib/crm/digest"
import type { Invoice, Quote } from "@/lib/billing/store"

const quoteInput: QuoteInput = {
  clientId: "",
  leadId: "l1",
  billTo: { name: "Sara Khan", business: "Khan Bakers", email: "sara@example.com", address: "Gulberg, Lahore" },
  currency: "PKR",
  title: "Bakery website with online menu",
  items: [
    { description: "Business Website", details: "Up to 10 pages · Blog", quantity: 1, unitPrice: 75000 },
    { description: "Extra page", details: "", quantity: 3, unitPrice: 5000 },
  ],
  discount: 5000,
  notes: "Live in 3 weeks.",
  validUntil: "2026-11-10",
  schedule: [
    { label: "Deposit to start", percent: 50 },
    { label: "Balance on delivery", percent: 50 },
  ],
}

describe("billing maths", () => {
  it("totals lines and the discount", () => {
    expect(documentTotal(quoteInput)).toBe(85000)
  })

  it("splits a total so the parts always add up", () => {
    expect(splitTotal(85000, quoteInput.schedule).map((p) => p.amount)).toEqual([42500, 42500])
    const thirds = splitTotal(1000, [
      { label: "A", percent: 33 },
      { label: "B", percent: 33 },
      { label: "C", percent: 34 },
    ])
    expect(thirds.map((p) => p.amount)).toEqual([330, 330, 340])
    expect(splitTotal(299, [{ label: "A", percent: 50 }, { label: "B", percent: 50 }]).reduce((s, p) => s + p.amount, 0)).toBe(299)
  })

  it("works out an invoice's state", () => {
    const base = { status: "sent" as const, dueDate: "2026-10-27", total: 100 }
    expect(invoiceState({ ...base, status: "draft", paid: 0 }, "2026-10-27")).toBe("draft")
    expect(invoiceState({ ...base, paid: 0 }, "2026-10-27")).toBe("unpaid")
    expect(invoiceState({ ...base, paid: 40 }, "2026-10-27")).toBe("partial")
    expect(invoiceState({ ...base, paid: 40 }, "2026-10-28")).toBe("overdue")
    expect(invoiceState({ ...base, paid: 100 }, "2026-12-01")).toBe("paid")
    expect(invoiceState({ ...base, status: "void", paid: 0 }, "2026-12-01")).toBe("void")
  })

  it("formats money and dates", () => {
    expect(money(42500, "PKR")).toBe("Rs 42,500")
    expect(money(1200, "USD")).toBe("$1,200")
    expect(addDays("2026-10-27", 7)).toBe("2026-11-03")
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02")
  })
})

describe("billing rules", () => {
  it("accepts a normal quote", () => {
    expect(quoteInputSchema.safeParse(quoteInput).success).toBe(true)
  })

  it("needs payments that add up to 100% and a discount below the subtotal", () => {
    const badSplit = quoteInputSchema.safeParse({ ...quoteInput, schedule: [{ label: "Deposit", percent: 50 }] })
    expect(badSplit.success ? "" : badSplit.error.issues[0].message).toBe("The payments must add up to 100%")
    const bigDiscount = quoteInputSchema.safeParse({ ...quoteInput, discount: 200000 })
    expect(bigDiscount.success ? "" : bigDiscount.error.issues[0].message).toBe("The discount is bigger than the subtotal")
  })

  it("rejects empty lines, fractions and a due date before the issue date", () => {
    expect(quoteInputSchema.safeParse({ ...quoteInput, items: [] }).success).toBe(false)
    expect(quoteInputSchema.safeParse({ ...quoteInput, items: [{ description: "", details: "", quantity: 1, unitPrice: 1 }] }).success).toBe(false)
    expect(quoteInputSchema.safeParse({ ...quoteInput, items: [{ description: "X", details: "", quantity: 1, unitPrice: 9.5 }] }).success).toBe(false)
    const invoice = { ...quoteInput, issueDate: "2026-10-27", dueDate: "2026-10-20" }
    expect(invoiceInputSchema.safeParse(invoice).success).toBe(false)
    expect(invoiceInputSchema.safeParse({ ...invoice, dueDate: "2026-11-03" }).success).toBe(true)
  })

  it("checks payments", () => {
    expect(paymentSchema.safeParse({ date: "2026-10-27", amount: 42500, method: "bank", reference: "TX123" }).success).toBe(true)
    expect(paymentSchema.safeParse({ date: "2026-10-27", amount: 0, method: "bank", reference: "" }).success).toBe(false)
    expect(paymentSchema.safeParse({ date: "2026-10-27", amount: 10, method: "card", reference: "" }).success).toBe(false)
  })

  it("ships valid default billing settings", () => {
    expect(billingSettingsSchema.safeParse(defaultBillingSettings).success).toBe(true)
    expect(defaultBillingSettings.defaultSchedule.reduce((s, p) => s + p.percent, 0)).toBe(100)
  })
})

const quote: Quote = {
  ...quoteInput,
  id: "q1",
  number: "Q-2026-001",
  status: "sent",
  token: "abcdefghijklmnopqrstuvwx",
  createdAt: new Date("2026-10-27T05:00:00Z"),
  updatedAt: new Date("2026-10-27T05:00:00Z"),
  createdBy: "Muhammad Bilal",
  invoiceIds: {},
  total: 85000,
  expired: false,
}

const invoice: Invoice = {
  ...quoteInput,
  id: "i1",
  number: "INV-2026-001",
  status: "sent",
  token: "zyxwvutsrqponmlkjihgfedc",
  issueDate: "2026-10-27",
  dueDate: "2026-11-03",
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "Muhammad Bilal",
  payments: [{ id: "p1", date: "2026-10-28", amount: 42500, method: "bank", reference: "TX123", recordedBy: "Muhammad Bilal", recordedAt: new Date() }],
  reminders: [],
  total: 85000,
  paid: 42500,
  balance: 42500,
  state: "partial",
}

describe("PDFs", () => {
  it("renders a quote and an invoice", async () => {
    const settings = { ...defaultBillingSettings, pkrInstructions: "Bank: Meezan\nIBAN: PK00 TEST" }
    for (const pdf of [await quotePdf(quote, settings), await invoicePdf(invoice, settings)]) {
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-")
      expect(pdf.length).toBeGreaterThan(2000)
    }
  }, 30000)
})

describe("overdue invoices in the digest", () => {
  it("lists only sent invoices past due with money owed", () => {
    const rows = overdueInvoiceRows([invoice, { ...invoice, id: "i2", dueDate: "2026-11-30" }, { ...invoice, id: "i3", balance: 0 }], "2026-11-05", "https://code-motive.dev")
    expect(rows).toEqual([{ name: "INV-2026-001 · Khan Bakers", detail: "Rs 42,500 still owed", note: "2 days late", url: "https://code-motive.dev/admin/invoices/i1" }])
  })
})
