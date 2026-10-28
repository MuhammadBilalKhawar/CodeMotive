import { describe, expect, it } from "vitest"
import { clientSchema, formatMoney, leadEditSchema, manualLeadSchema, pakistanDate, whatsappLink, type LeadEdit } from "@/lib/crm/schemas"
import { digestRows } from "@/lib/crm/digest"
import { followUpText } from "@/components/admin/crm/badges"
import { clientFromLead } from "@/lib/crm/clients"
import type { Lead } from "@/lib/leads"

const edit: LeadEdit = {
  name: "Ali Raza",
  email: "",
  phone: "+92 300 1234567",
  business: "Raza Foods",
  service: "Business website",
  source: "whatsapp",
  stage: "new",
  lostReason: "",
  value: { amount: 85000, currency: "PKR" },
  ownerId: "",
  followUpOn: "2026-10-27",
  tags: ["restaurant"],
}

const lead = (patch: Partial<Lead> = {}): Lead => ({
  id: "l1",
  kind: "contact",
  createdAt: new Date(Date.now() - 30 * 3_600_000),
  name: "Ali Raza",
  email: "ali@example.com",
  fields: [["Country", "Pakistan"]],
  reply: "",
  replySource: "template",
  ipCountry: null,
  phone: "",
  business: "Raza Foods",
  service: "Business website",
  source: "website",
  stage: "new",
  lostReason: "",
  value: null,
  ownerId: "u1",
  followUpOn: "",
  tags: [],
  ...patch,
})

describe("lead rules", () => {
  it("accepts a WhatsApp lead with only a phone number", () => {
    expect(leadEditSchema.safeParse(edit).success).toBe(true)
  })

  it("needs an email or a phone", () => {
    const result = manualLeadSchema.safeParse({ ...edit, phone: "", note: "" })
    expect(result.success).toBe(false)
    expect(result.success ? "" : result.error.issues[0].message).toBe("Add an email or a phone number")
  })

  it("rejects bad dates, amounts and phone numbers", () => {
    expect(leadEditSchema.safeParse({ ...edit, followUpOn: "27/10/2026" }).success).toBe(false)
    expect(leadEditSchema.safeParse({ ...edit, value: { amount: 12.5, currency: "PKR" } }).success).toBe(false)
    expect(leadEditSchema.safeParse({ ...edit, phone: "call me" }).success).toBe(false)
  })

  it("checks client details", () => {
    const client = { name: "Ali", business: "", email: "nope", phone: "", country: "", currency: "PKR", address: "", status: "active", notes: "", tags: [] }
    expect(clientSchema.safeParse(client).success).toBe(false)
    expect(clientSchema.safeParse({ ...client, email: "ali@example.com" }).success).toBe(true)
  })
})

describe("helpers", () => {
  it("builds WhatsApp links from local and international numbers", () => {
    expect(whatsappLink("+92 300 1234567")).toBe("https://wa.me/923001234567")
    expect(whatsappLink("0300-1234567")).toBe("https://wa.me/923001234567")
    expect(whatsappLink("0044 20 7946 0958")).toBe("https://wa.me/442079460958")
    expect(whatsappLink("12345")).toBeNull()
  })

  it("formats money and Pakistan dates", () => {
    expect(formatMoney({ amount: 85000, currency: "PKR" })).toBe("Rs 85,000")
    expect(formatMoney({ amount: 1200, currency: "USD" })).toBe("$1,200")
    // 23:30 UTC is already the next day in Pakistan (UTC+5).
    expect(pakistanDate(new Date("2026-10-26T23:30:00Z"))).toBe("2026-10-27")
  })

  it("describes follow-up dates", () => {
    expect(followUpText("2026-10-27", "2026-10-27")).toBe("Today")
    expect(followUpText("2026-10-28", "2026-10-27")).toBe("Tomorrow")
    expect(followUpText("2026-10-24", "2026-10-27")).toBe("3 days late")
  })

  it("guesses the client's currency from the lead", () => {
    expect(clientFromLead(lead()).currency).toBe("PKR")
    expect(clientFromLead(lead({ fields: [["Country", "United Kingdom"]] })).currency).toBe("USD")
    expect(clientFromLead(lead({ value: { amount: 900, currency: "USD" } })).currency).toBe("USD")
  })
})

describe("daily digest", () => {
  it("lists late follow-ups and waiting leads without repeating a lead", () => {
    const late = lead({ id: "a", name: "Late Lead", followUpOn: "2026-10-25" })
    const waiting = lead({ id: "b", name: "Waiting Lead" })
    const rows = digestRows({
      followUps: [late],
      uncontacted: [late, waiting],
      owners: new Map([["u1", "Muhammad Bilal"]]),
      today: "2026-10-27",
      siteUrl: "https://code-motive.dev",
    })
    expect(rows.followUps).toEqual([
      { name: "Late Lead", detail: "Raza Foods · Business website · New · Muhammad Bilal", note: "2 days late", url: "https://code-motive.dev/admin/leads/a" },
    ])
    expect(rows.uncontacted.map((r) => [r.name, r.note])).toEqual([["Waiting Lead", "30 hours waiting"]])
  })
})
