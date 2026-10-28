import { getEnv } from "@/lib/env"
import type { LeadTask } from "@/lib/tasks"

// Atlassian Document Format helpers (Jira Cloud REST API v3 descriptions).
type AdfNode = Record<string, unknown>
const text = (value: string, strong = false): AdfNode => ({ type: "text", text: value || "—", ...(strong && { marks: [{ type: "strong" }] }) })
const paragraph = (...content: AdfNode[]): AdfNode => ({ type: "paragraph", content })
const heading = (value: string): AdfNode => ({ type: "heading", attrs: { level: 3 }, content: [text(value)] })
const bulletList = (items: AdfNode[][]): AdfNode => ({
  type: "bulletList",
  content: items.map((content) => ({ type: "listItem", content: [paragraph(...content)] })),
})

function description(task: LeadTask): AdfNode {
  const content: AdfNode[] = [
    heading(task.kind === "mockup" ? "Mockup request" : "Lead details"),
    bulletList(task.fields.map(([label, value]) => [text(`${label}: `, true), text(value)])),
    heading("Reply shown on the website"),
    ...task.reply.split(/\n+/).filter(Boolean).map((line) => paragraph(text(line))),
  ]
  if (task.steps?.length) content.push(heading("Steps"), bulletList(task.steps.map((step) => [text(step)])))
  return { type: "doc", version: 1, content }
}

// Jira labels can't contain spaces.
const toLabel = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

export async function createJiraIssue(task: LeadTask): Promise<{ url?: string }> {
  const env = getEnv()
  if (!env.JIRA_BASE_URL || !env.JIRA_EMAIL || !env.JIRA_API_TOKEN) return {}

  const base = env.JIRA_BASE_URL.replace(/\/+$/, "")
  const res = await fetch(`${base}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString("base64")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: env.JIRA_PROJECT_KEY },
        issuetype: { name: env.JIRA_ISSUE_TYPE },
        summary: task.summary.slice(0, 250),
        description: description(task),
        labels: task.labels.map(toLabel).filter(Boolean),
        duedate: task.dueDate,
      },
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`Jira HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  const issue = (await res.json()) as { key: string }
  return { url: `${base}/browse/${issue.key}` }
}
