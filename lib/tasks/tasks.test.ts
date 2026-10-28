import { afterEach, describe, expect, it, vi } from "vitest"
import { createLeadTask, dueInWorkingDays } from "@/lib/tasks"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const task = {
  kind: "contact" as const,
  summary: "Ali Khan · Business website · Pakistan",
  fields: [["Name", "Ali Khan"]] as [string, string][],
  reply: "Thanks Ali!",
  labels: ["lead", "Business website"],
  dueDate: "2026-10-26",
}

describe("dueInWorkingDays", () => {
  it("skips the weekend", () => {
    // Thursday 22 Oct 2026 + 3 working days = Tuesday 27 Oct.
    expect(dueInWorkingDays(3, new Date("2026-10-22T06:00:00Z"))).toBe("2026-10-27")
  })
})

describe("createLeadTask", () => {
  it("does nothing when no task provider is set", async () => {
    vi.stubEnv("TASK_PROVIDER", "")
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)
    expect(await createLeadTask(task)).toEqual({})
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("creates a Jira issue with labels and due date, and returns its link", async () => {
    vi.stubEnv("TASK_PROVIDER", "jira")
    vi.stubEnv("JIRA_BASE_URL", "https://codemotive.atlassian.net/")
    vi.stubEnv("JIRA_EMAIL", "bot@code-motive.dev")
    vi.stubEnv("JIRA_API_TOKEN", "token")
    let sent: { fields: Record<string, unknown> } | undefined
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent = JSON.parse(String(init.body))
        return new Response(JSON.stringify({ key: "LEAD-12" }), { status: 201 })
      }),
    )
    expect(await createLeadTask(task)).toEqual({ url: "https://codemotive.atlassian.net/browse/LEAD-12" })
    expect(sent?.fields).toMatchObject({
      project: { key: "LEAD" },
      issuetype: { name: "Task" },
      labels: ["lead", "business-website"],
      duedate: "2026-10-26",
    })
  })
})
