import type { DigestRow } from "@/lib/email/templates"
import { money } from "@/lib/billing/schemas"
import { activeProjectStages, projectStageLabels, renewalAlertDays, renewalKindLabels } from "@/lib/delivery/schemas"
import type { Project, Renewal } from "@/lib/delivery/store"

// Digest rows for delivery work. Pure, so they're tested without a database.

const when = (days: number) => (days < 0 ? `${-days} day${days === -1 ? "" : "s"} late` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`)

// Renewals on their reminder days (30, 14, 7, 3, 1, 0 days before), and every day once overdue.
export function renewalRows(renewals: Renewal[], clientNames: Map<string, string>, siteUrl: string): DigestRow[] {
  return renewals
    .filter((r) => r.daysLeft < 0 || renewalAlertDays.includes(r.daysLeft))
    .map((r) => ({
      name: `${renewalKindLabels[r.kind]}: ${r.name}`,
      detail: [
        clientNames.get(r.clientId) ?? "",
        r.provider,
        r.cost !== null ? money(r.cost, r.currency) : "",
        r.paidBy === "client" ? "client pays" : "we pay",
        r.autoRenew ? "auto-renews" : "renew by hand",
      ]
        .filter(Boolean)
        .join(" · "),
      note: when(r.daysLeft),
      url: `${siteUrl}/admin/renewals`,
    }))
}

// Active projects due within 3 days or past their deadline.
export function deadlineRows(projects: Project[], clientNames: Map<string, string>, siteUrl: string): DigestRow[] {
  return projects
    .filter((p) => activeProjectStages.includes(p.stage) && p.daysLeft !== null && p.daysLeft <= 3)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
    .map((p) => ({
      name: p.name,
      detail: [clientNames.get(p.clientId) ?? "", projectStageLabels[p.stage], `${p.progress}% of the checklist done`].filter(Boolean).join(" · "),
      note: when(p.daysLeft ?? 0),
      url: `${siteUrl}/admin/projects/${p.id}`,
    }))
}
