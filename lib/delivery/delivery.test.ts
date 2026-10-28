import { describe, expect, it } from "vitest"
import { carePlanInputSchema, checklistTemplates, daysUntil, nextPeriod, periodLabel, projectInputSchema, renewalInputSchema } from "@/lib/delivery/schemas"
import { deadlineRows, renewalRows } from "@/lib/delivery/digest"
import type { Project, Renewal } from "@/lib/delivery/store"

describe("billing periods", () => {
  it("moves to the same day next month, clamped to the month's end", () => {
    expect(nextPeriod("2026-10-27", "monthly")).toBe("2026-11-27")
    expect(nextPeriod("2026-12-05", "monthly")).toBe("2027-01-05")
    expect(nextPeriod("2027-01-31", "monthly")).toBe("2027-02-28")
    expect(nextPeriod("2028-01-31", "monthly")).toBe("2028-02-29")
    expect(nextPeriod("2028-02-29", "yearly")).toBe("2029-02-28")
  })

  it("names the period an invoice covers", () => {
    expect(periodLabel("2026-11-05", "monthly")).toBe("November 2026")
    expect(periodLabel("2026-11-05", "yearly")).toBe("2026–2027")
  })

  it("counts days to a date", () => {
    expect(daysUntil("2026-11-03", "2026-10-27")).toBe(7)
    expect(daysUntil("2026-10-25", "2026-10-27")).toBe(-2)
  })
})

describe("delivery rules", () => {
  const project = {
    name: "Khan Bakers website",
    clientId: "c1",
    quoteId: "",
    kind: "website",
    stage: "build",
    ownerId: "",
    startDate: "2026-10-27",
    dueDate: "",
    links: { live: "", staging: "", jira: "", repo: "", design: "" },
    notes: "",
    handoverNotes: "",
  }

  it("checks projects", () => {
    expect(projectInputSchema.safeParse(project).success).toBe(true)
    expect(projectInputSchema.safeParse({ ...project, clientId: "" }).success).toBe(false)
    expect(projectInputSchema.safeParse({ ...project, links: { ...project.links, live: "khanbakers.com" } }).success).toBe(false)
  })

  it("has a starting checklist for every project type", () => {
    for (const list of Object.values(checklistTemplates)) expect(list.length).toBeGreaterThan(3)
  })

  it("checks care plans and renewals", () => {
    const plan = { clientId: "c1", projectId: "", name: "Care Plan Plus", description: "", amount: 10000, currency: "PKR", interval: "monthly", nextInvoiceOn: "2026-11-01", status: "active", invoiceMode: "draft" }
    expect(carePlanInputSchema.safeParse(plan).success).toBe(true)
    expect(carePlanInputSchema.safeParse({ ...plan, amount: 0 }).success).toBe(false)
    const renewal = { clientId: "", projectId: "", kind: "domain", name: "khanbakers.com", provider: "", renewsOn: "2027-10-27", cost: null, currency: "PKR", paidBy: "client", autoRenew: false, notes: "" }
    expect(renewalInputSchema.safeParse(renewal).success).toBe(true)
    expect(renewalInputSchema.safeParse({ ...renewal, name: "" }).success).toBe(false)
  })
})

describe("delivery digest", () => {
  const renewal = (daysLeft: number): Renewal =>
    ({ id: `r${daysLeft}`, kind: "domain", name: `site${daysLeft}.com`, clientId: "c1", projectId: "", provider: "Namecheap", renewsOn: "", cost: 3500, currency: "PKR", paidBy: "us", autoRenew: false, notes: "", daysLeft }) as Renewal

  it("mentions renewals only on reminder days, and daily once overdue", () => {
    const rows = renewalRows([renewal(45), renewal(30), renewal(29), renewal(14), renewal(1), renewal(0), renewal(-3)], new Map([["c1", "Khan Bakers"]]), "https://code-motive.dev")
    expect(rows.map((r) => r.note)).toEqual(["In 30 days", "In 14 days", "Tomorrow", "Today", "3 days late"])
    expect(rows[0].detail).toBe("Khan Bakers · Namecheap · Rs 3,500 · we pay · renew by hand")
  })

  it("lists active projects due within 3 days or late", () => {
    const p = (id: string, stage: Project["stage"], daysLeft: number | null) => ({ id, name: id, clientId: "c1", stage, daysLeft, progress: 40 }) as Project
    const rows = deadlineRows([p("late", "build", -1), p("soon", "review", 2), p("later", "build", 10), p("done", "launched", -5), p("none", "design", null)], new Map(), "https://x.test")
    expect(rows.map((r) => [r.name, r.note])).toEqual([
      ["late", "1 day late"],
      ["soon", "In 2 days"],
    ])
  })
})
