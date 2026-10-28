import { getEnv } from "@/lib/env"
import { createJiraIssue } from "@/lib/tasks/jira"

export type LeadTask = {
  kind: "contact" | "mockup"
  summary: string
  fields: [string, string][]
  reply: string
  labels: string[]
  // YYYY-MM-DD
  dueDate: string
  // Checklist for the person picking it up (mockups).
  steps?: string[]
}

// Sends a new lead to the configured task manager. TASK_PROVIDER picks it;
// anything else (or missing keys) is a no-op. Errors are thrown to the caller,
// which logs them without affecting the visitor's reply.
export async function createLeadTask(task: LeadTask): Promise<{ url?: string }> {
  switch (getEnv().TASK_PROVIDER) {
    case "jira":
      return createJiraIssue(task)
    default:
      return {}
  }
}

// Dates in Pakistan time, since that's where the team works.
const karachiDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(date)

export function dueInDays(days: number, from = new Date()) {
  return karachiDate(new Date(from.getTime() + days * 24 * 60 * 60 * 1000))
}

// Skips Saturdays and Sundays.
export function dueInWorkingDays(days: number, from = new Date()) {
  const date = new Date(from)
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return karachiDate(date)
}
