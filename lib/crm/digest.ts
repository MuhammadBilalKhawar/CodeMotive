import type { Lead } from "@/lib/leads"
import type { DigestRow } from "@/lib/email/templates"
import { stageLabels } from "@/lib/crm/schemas"
import { money } from "@/lib/billing/schemas"
import type { Invoice } from "@/lib/billing/store"

// Rows for the morning digest email. Pure, so it can be tested without a database.
export function digestRows({
  followUps,
  uncontacted,
  owners,
  today,
  siteUrl,
}: {
  followUps: Lead[]
  uncontacted: Lead[]
  owners: Map<string, string>
  today: string
  siteUrl: string
}) {
  const detail = (lead: Lead) =>
    [lead.business, lead.service, stageLabels[lead.stage], owners.get(lead.ownerId) ?? "No owner"].filter(Boolean).join(" · ")
  const url = (lead: Lead) => `${siteUrl}/admin/leads/${lead.id}`

  const due: DigestRow[] = followUps.map((lead) => {
    const late = Math.round((Date.parse(today) - Date.parse(lead.followUpOn)) / 86_400_000)
    return { name: lead.name, detail: detail(lead), note: late > 0 ? `${late} day${late === 1 ? "" : "s"} late` : "Today", url: url(lead) }
  })
  // A lead with a follow-up date already shows above.
  const listed = new Set(followUps.map((lead) => lead.id))
  const waiting: DigestRow[] = uncontacted
    .filter((lead) => !listed.has(lead.id))
    .map((lead) => {
      const hours = Math.floor((Date.now() - lead.createdAt.getTime()) / 3_600_000)
      return { name: lead.name, detail: detail(lead), note: hours >= 48 ? `${Math.floor(hours / 24)} days waiting` : `${hours} hours waiting`, url: url(lead) }
    })
  return { followUps: due, uncontacted: waiting }
}

// Sent invoices past their due date that still have money owed.
export function overdueInvoiceRows(invoices: Invoice[], today: string, siteUrl: string): DigestRow[] {
  return invoices
    .filter((invoice) => invoice.balance > 0 && invoice.dueDate < today)
    .map((invoice) => {
      const late = Math.round((Date.parse(today) - Date.parse(invoice.dueDate)) / 86_400_000)
      return {
        name: `${invoice.number} · ${invoice.billTo.business || invoice.billTo.name}`,
        detail: `${money(invoice.balance, invoice.currency)} still owed${invoice.reminders.length ? ` · ${invoice.reminders.length} reminder${invoice.reminders.length === 1 ? "" : "s"} sent` : ""}`,
        note: `${late} day${late === 1 ? "" : "s"} late`,
        url: `${siteUrl}/admin/invoices/${invoice.id}`,
      }
    })
}
