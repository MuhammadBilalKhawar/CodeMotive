import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
// vi.mock calls below are hoisted above this import by Vitest.
import { GET } from "@/app/api/cron/digest/route"

const mocks = vi.hoisted(() => ({ dueFollowUps: vi.fn(), uncontactedLeads: vi.fn(), sendDigestEmail: vi.fn(), openInvoices: vi.fn(), emailInvoice: vi.fn(), addReminder: vi.fn(), autoReminders: false, carePlansDue: vi.fn(), invoiceCarePlan: vi.fn(), listRenewals: vi.fn() }))

vi.mock("@/lib/leads", () => ({ dueFollowUps: mocks.dueFollowUps, uncontactedLeads: mocks.uncontactedLeads }))
vi.mock("@/lib/auth/users", () => ({ listUsers: async () => [] }))
vi.mock("@/lib/email/send", () => ({ sendDigestEmail: mocks.sendDigestEmail }))
vi.mock("@/lib/audit", () => ({ logActivity: async () => {} }))
vi.mock("@/lib/billing/store", () => ({
  openInvoices: mocks.openInvoices,
  addReminder: mocks.addReminder,
  getBillingSettings: async () => ({ autoReminders: mocks.autoReminders }),
}))
vi.mock("@/lib/billing/send", () => ({ emailInvoice: mocks.emailInvoice }))
vi.mock("@/lib/crm/clients", () => ({ listClients: async () => [] }))
vi.mock("@/lib/delivery/store", () => ({ carePlansDue: mocks.carePlansDue, listProjects: async () => [], listRenewals: mocks.listRenewals }))
vi.mock("@/lib/delivery/care-billing", () => ({ invoiceCarePlan: mocks.invoiceCarePlan }))

// "YYYY-MM-DD" n days before today in Pakistan.
const daysAgo = (n: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(Date.now() - n * 86_400_000))
const overdue = (lateDays: number) => ({
  id: `inv${lateDays}`,
  number: `INV-2026-00${lateDays}`,
  billTo: { name: "Sara", business: "Khan Bakers", email: "sara@example.com", address: "" },
  currency: "PKR",
  balance: 37500,
  dueDate: daysAgo(lateDays),
  reminders: [],
})

const call = (auth?: string) => GET(new Request("http://localhost/api/cron/digest", { headers: auth ? { authorization: auth } : {} }))

const waiting = {
  id: "a",
  name: "Ali",
  business: "",
  service: "",
  stage: "new",
  ownerId: "",
  followUpOn: "",
  createdAt: new Date(Date.now() - 30 * 3_600_000),
}

describe("GET /api/cron/digest", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "cron-test-secret")
    mocks.dueFollowUps.mockResolvedValue([])
    mocks.uncontactedLeads.mockResolvedValue([])
    mocks.sendDigestEmail.mockResolvedValue("sent")
    mocks.openInvoices.mockResolvedValue([])
    mocks.emailInvoice.mockResolvedValue("sent")
    mocks.autoReminders = false
    mocks.carePlansDue.mockResolvedValue([])
    mocks.listRenewals.mockResolvedValue([])
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("is off without CRON_SECRET", async () => {
    vi.stubEnv("CRON_SECRET", "")
    expect((await call("Bearer anything")).status).toBe(503)
  })

  it("refuses a missing or wrong secret", async () => {
    expect((await call()).status).toBe(401)
    expect((await call("Bearer wrong")).status).toBe(401)
    expect(mocks.sendDigestEmail).not.toHaveBeenCalled()
  })

  it("sends nothing when nothing is due", async () => {
    const body = await (await call("Bearer cron-test-secret")).json()
    expect(body).toMatchObject({ ok: true, sent: false })
    expect(mocks.sendDigestEmail).not.toHaveBeenCalled()
  })

  it("emails waiting leads", async () => {
    mocks.uncontactedLeads.mockResolvedValue([waiting])
    const body = await (await call("Bearer cron-test-secret")).json()
    expect(body).toMatchObject({ ok: true, sent: true, counts: { "Waiting for a first reply": 1 } })
    expect(mocks.sendDigestEmail.mock.calls[0][0].sections[0].rows[0].name).toBe("Ali")
  })

  it("lists overdue invoices, without emailing clients unless switched on", async () => {
    mocks.openInvoices.mockResolvedValue([overdue(3)])
    const body = await (await call("Bearer cron-test-secret")).json()
    expect(body).toMatchObject({ sent: true, counts: { "Overdue invoices": 1 }, reminded: 0 })
    expect(mocks.sendDigestEmail.mock.calls[0][0].sections[0].rows[0]).toMatchObject({ name: "INV-2026-003 · Khan Bakers", note: "3 days late" })
    expect(mocks.emailInvoice).not.toHaveBeenCalled()
  })

  it("reminds clients 3 and 10 days late when automatic reminders are on", async () => {
    mocks.autoReminders = true
    mocks.openInvoices.mockResolvedValue([overdue(3), overdue(5), overdue(10)])
    const body = await (await call("Bearer cron-test-secret")).json()
    expect(body.reminded).toBe(2)
    expect(mocks.emailInvoice.mock.calls.map((c) => c[0].number)).toEqual(["INV-2026-003", "INV-2026-0010"])
    expect(mocks.addReminder).toHaveBeenCalledTimes(2)
  })

  it("invoices care plans that are due and lists renewals on reminder days", async () => {
    mocks.carePlansDue.mockResolvedValue([{ id: "c1", name: "Care Plan Plus", amount: 10000, currency: "PKR" }])
    mocks.invoiceCarePlan.mockResolvedValue({ invoiceId: "inv9", emailed: false })
    const renewal = (daysLeft: number) => ({ id: `r${daysLeft}`, kind: "domain", name: `site${daysLeft}.com`, clientId: "", provider: "", cost: null, currency: "PKR", paidBy: "client", autoRenew: false, daysLeft })
    mocks.listRenewals.mockResolvedValue([renewal(30), renewal(20), renewal(7), renewal(-2)])
    const body = await (await call("Bearer cron-test-secret")).json()
    expect(body.counts).toMatchObject({ "Care plan invoices": 1, "Renewals coming up": 3 })
    const sections = mocks.sendDigestEmail.mock.calls[0][0].sections
    expect(sections.find((s: { title: string }) => s.title === "Care plan invoices").rows[0]).toMatchObject({ name: "Care Plan Plus", note: "Draft: check and send" })
    expect(sections.find((s: { title: string }) => s.title === "Renewals coming up").rows.map((r: { note: string }) => r.note)).toEqual(["In 30 days", "In 7 days", "2 days late"])
  })
})
