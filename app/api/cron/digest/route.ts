import { getEnv } from "@/lib/env"
import { safeEqual } from "@/lib/auth/session"
import { dueFollowUps, uncontactedLeads } from "@/lib/leads"
import { listUsers } from "@/lib/auth/users"
import { listClients } from "@/lib/crm/clients"
import { digestRows, overdueInvoiceRows } from "@/lib/crm/digest"
import { pakistanDate } from "@/lib/crm/schemas"
import { addReminder, getBillingSettings, openInvoices } from "@/lib/billing/store"
import { emailInvoice } from "@/lib/billing/send"
import { money } from "@/lib/billing/schemas"
import { carePlansDue, listProjects, listRenewals } from "@/lib/delivery/store"
import { invoiceCarePlan } from "@/lib/delivery/care-billing"
import { deadlineRows, renewalRows } from "@/lib/delivery/digest"
import type { DigestRow } from "@/lib/email/templates"
import { sendDigestEmail } from "@/lib/email/send"
import { logActivity } from "@/lib/audit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Automatic client reminders go out this many days after the due date.
const REMINDER_DAYS = [3, 10]

// Daily job, called by Vercel Cron (vercel.json) at 9:00 Pakistan time. Vercel
// sends "Authorization: Bearer $CRON_SECRET". Creates care plan invoices that
// are due, reminds clients about late invoices (if switched on), then emails
// the team the day's follow-ups, deadlines, renewals and money owed.
export async function GET(request: Request) {
  const env = getEnv()
  if (!env.CRON_SECRET) return Response.json({ ok: false, error: "CRON_SECRET isn't set." }, { status: 503 })
  const auth = request.headers.get("authorization") ?? ""
  if (!safeEqual(auth, `Bearer ${env.CRON_SECRET}`)) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const today = pakistanDate()
  const site = env.NEXT_PUBLIC_SITE_URL

  // 1. Care plan invoices due today.
  const careRows: DigestRow[] = []
  for (const plan of await carePlansDue(today)) {
    try {
      const result = await invoiceCarePlan(plan, "Care plan")
      if (result) {
        careRows.push({
          name: plan.name,
          detail: money(plan.amount, plan.currency),
          note: result.emailed ? "Invoice emailed" : "Draft: check and send",
          url: `${site}/admin/invoices/${result.invoiceId}`,
        })
      }
    } catch (error) {
      console.error(`[digest] Care plan ${plan.name} couldn't be invoiced`, error)
    }
  }

  const [followUps, uncontacted, users, invoices, billing, renewals, projects, clients] = await Promise.all([
    dueFollowUps(today),
    // New leads more than a day old that nobody has contacted.
    uncontactedLeads(new Date(Date.now() - 24 * 3_600_000)),
    listUsers(),
    openInvoices(),
    getBillingSettings(),
    listRenewals(),
    listProjects(),
    listClients(),
  ])
  const clientNames = new Map(clients.map((c) => [c.id, c.business || c.name]))

  // 2. Automatic reminders for late invoices.
  let reminded = 0
  if (billing.autoReminders) {
    for (const invoice of invoices) {
      const late = Math.round((Date.parse(today) - Date.parse(invoice.dueDate)) / 86_400_000)
      const remindedToday = invoice.reminders.some((r) => pakistanDate(r.at) === today)
      if (!REMINDER_DAYS.includes(late) || remindedToday || !invoice.billTo.email) continue
      try {
        if ((await emailInvoice(invoice, "reminder")) === "sent") {
          await addReminder(invoice.id, "Automatic")
          reminded++
        }
      } catch (error) {
        console.error(`[digest] Reminder for ${invoice.number} failed`, error)
      }
    }
  }

  // 3. The team's email.
  const leads = digestRows({ followUps, uncontacted, owners: new Map(users.map((u) => [u.id, u.name])), today, siteUrl: site })
  const sections = [
    { title: "Follow up today", rows: leads.followUps },
    { title: "Waiting for a first reply", rows: leads.uncontacted },
    { title: "Project deadlines", rows: deadlineRows(projects, clientNames, site) },
    { title: "Overdue invoices", rows: overdueInvoiceRows(invoices, today, site) },
    { title: "Care plan invoices", rows: careRows },
    { title: "Renewals coming up", rows: renewalRows(renewals, clientNames, site) },
  ]
  const counts = Object.fromEntries(sections.map((s) => [s.title, s.rows.length]))
  if (sections.every((s) => s.rows.length === 0)) return Response.json({ ok: true, sent: false, reason: "Nothing due today.", counts, reminded })

  const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "Asia/Karachi" }).format(new Date())
  try {
    const status = await sendDigestEmail({ date, sections: sections.filter((s) => s.rows.length), adminUrl: `${site}/admin` })
    await logActivity(null, { action: "sent", entity: "digest", summary: `Daily digest: ${sections.filter((s) => s.rows.length).map((s) => `${s.rows.length} ${s.title.toLowerCase()}`).join(", ")} (${status})` })
    return Response.json({ ok: true, sent: status === "sent", counts, reminded })
  } catch (error) {
    console.error("[digest] Sending failed", error)
    return Response.json({ ok: false, error: "Sending failed.", counts }, { status: 500 })
  }
}
