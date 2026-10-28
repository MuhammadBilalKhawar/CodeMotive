import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { defaultPricing } from "@/data/pricing"
import { defaultProjects } from "@/data/projects"
// vi.mock calls below are hoisted above this import by Vitest.
import { POST } from "@/app/api/contact/route"

// Background work registered with next/server's after(); awaited by the tests.
const background: Promise<unknown>[] = []
vi.mock("next/server", () => ({ after: (fn: () => Promise<unknown>) => void background.push(fn()) }))

const mocks = vi.hoisted(() => ({
  isRateLimited: vi.fn(),
  verifyTurnstile: vi.fn(),
  saveLead: vi.fn(),
  updateLead: vi.fn(),
  saveUpload: vi.fn(),
  createLeadTask: vi.fn(),
  sendOwnerEmail: vi.fn(),
  sendVisitorEmail: vi.fn(),
}))

// No database: every CMS read returns its default.
vi.mock("@/lib/content", () => ({
  getPricing: async () => defaultPricing,
  getProjects: async () => defaultProjects,
  readContent: async (_id: string, _schema: unknown, fallback: unknown) => fallback,
}))
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: mocks.isRateLimited }))
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }))
vi.mock("@/lib/leads", () => ({ saveLead: mocks.saveLead, updateLead: mocks.updateLead, saveUpload: mocks.saveUpload }))
vi.mock("@/lib/email/send", () => ({ sendOwnerEmail: mocks.sendOwnerEmail, sendVisitorEmail: mocks.sendVisitorEmail }))
vi.mock("@/lib/tasks", async (importOriginal) => ({ ...(await importOriginal<object>()), createLeadTask: mocks.createLeadTask }))


const lead = {
  name: "Ali Khan",
  email: "ali@example.com",
  phone: "",
  business: "Ali's Cafe",
  country: "PK",
  service: "Business website",
  budget: "",
  message: "How much is a website for my cafe in Lahore?",
}

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/contact", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "10.1.1.1" }, body: JSON.stringify(body) }))

beforeEach(() => {
  background.length = 0
  vi.clearAllMocks()
  // No AI keys: the reply is the fixed template, so tests never call a provider.
  vi.stubEnv("GROQ_API_KEY", "")
  vi.stubEnv("GEMINI_API_KEY", "")
  mocks.isRateLimited.mockResolvedValue(false)
  mocks.verifyTurnstile.mockResolvedValue(true)
  mocks.saveLead.mockResolvedValue("lead-1")
  mocks.updateLead.mockResolvedValue(undefined)
  mocks.createLeadTask.mockResolvedValue({ url: "https://jira.example/browse/LEAD-1" })
  mocks.sendOwnerEmail.mockResolvedValue("sent")
  mocks.sendVisitorEmail.mockResolvedValue("sent")
})
afterEach(() => vi.unstubAllEnvs())

describe("POST /api/contact", () => {
  it("returns { ok, reply } for a valid lead, then saves it, creates the task and sends both emails", async () => {
    const res = await post(lead)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ ok: true })
    expect(body.reply).toContain("Thanks Ali!")

    await Promise.all(background)
    expect(mocks.saveLead).toHaveBeenCalledOnce()
    expect(mocks.createLeadTask).toHaveBeenCalledWith(expect.objectContaining({ summary: "Ali Khan · Business website · Pakistan" }))
    expect(mocks.sendOwnerEmail).toHaveBeenCalledWith(expect.objectContaining({ taskUrl: "https://jira.example/browse/LEAD-1", visitorEmail: "ali@example.com" }))
    expect(mocks.sendVisitorEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "ali@example.com" }))
    expect(mocks.updateLead).toHaveBeenCalledWith("lead-1", expect.objectContaining({ ownerEmail: "sent", visitorEmail: "sent" }))
  })

  it("returns 200 for a filled honeypot but does nothing else", async () => {
    const res = await post({ ...lead, company_website: "http://spam.example" })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    await Promise.all(background)
    for (const fn of Object.values(mocks)) expect(fn).not.toHaveBeenCalled()
  })

  it("still returns the reply when Resend and Jira both fail", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.createLeadTask.mockRejectedValue(new Error("Jira HTTP 500"))
    mocks.sendOwnerEmail.mockRejectedValue(new Error("Resend down"))
    mocks.sendVisitorEmail.mockRejectedValue(new Error("Resend down"))

    const res = await post(lead)
    expect(res.status).toBe(200)
    expect((await res.json()).reply).toContain("Thanks Ali!")

    await Promise.all(background)
    expect(mocks.updateLead).toHaveBeenCalledWith("lead-1", { taskUrl: undefined, ownerEmail: "failed", visitorEmail: "failed" })
  })

  it("rejects invalid input with field errors", async () => {
    const res = await post({ ...lead, email: "not-an-email", message: "short" })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(Object.keys(body.fields).sort()).toEqual(["email", "message"])
    expect(mocks.saveLead).not.toHaveBeenCalled()
  })

  it("rejects a failed Turnstile check", async () => {
    mocks.verifyTurnstile.mockResolvedValue(false)
    const res = await post(lead)
    expect(res.status).toBe(400)
    expect(background).toHaveLength(0)
  })

  it("rate-limits with 429", async () => {
    mocks.isRateLimited.mockResolvedValue(true)
    const res = await post(lead)
    expect(res.status).toBe(429)
    expect(background).toHaveLength(0)
  })

  it("rejects a body that isn't JSON", async () => {
    const res = await POST(new Request("http://localhost/api/contact", { method: "POST", body: "not json" }))
    expect(res.status).toBe(400)
  })
})
