import Link from "next/link"
import { ArrowRight, CalendarClock, CheckCircle2, FolderKanban, Inbox, Receipt, RefreshCw, XCircle } from "lucide-react"
import { isDbConfigured } from "@/lib/db"
import { features } from "@/lib/env"
import { requireUser } from "@/lib/auth/current"
import { dueFollowUps } from "@/lib/leads"
import { openInvoices } from "@/lib/billing/store"
import { listProjects, listRenewals } from "@/lib/delivery/store"
import { listClients } from "@/lib/crm/clients"
import { activeProjectStages, renewalKindLabels } from "@/lib/delivery/schemas"
import { loadReport } from "@/lib/reports"
import { change } from "@/lib/reports/compute"
import { money as formatMoney } from "@/lib/billing/schemas"
import { ColumnChart } from "@/components/admin/reports/charts"
import { Stat, percent, perCurrency } from "@/components/admin/reports/stat"
import { Card, buttonClass } from "@/components/admin/ui"

type Todo = { key: string; icon: typeof Inbox; kind: string; title: string; detail: string; when: string; late: boolean; href: string }

const when = (days: number) => (days < 0 ? `${-days} day${days === -1 ? "" : "s"} late` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`)
const greeting = (hour: number) => (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening")

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser()
  const owner = user.role === "owner"
  const { denied } = await searchParams
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Karachi" }).format(new Date()))

  let dbError: string | null = null
  let report: Awaited<ReturnType<typeof loadReport>> | null = null
  const todos: Todo[] = []
  try {
    const [r, followUps, projects, renewals, invoices, clients] = await Promise.all([
      loadReport(30, { money: owner }),
      dueFollowUps(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())),
      listProjects(),
      listRenewals(),
      owner ? openInvoices() : Promise.resolve([]),
      listClients(),
    ])
    report = r
    const clientName = new Map(clients.map((c) => [c.id, c.business || c.name]))
    for (const lead of followUps) {
      const days = Math.round((Date.parse(lead.followUpOn) - Date.parse(r.today)) / 86_400_000)
      todos.push({ key: `l${lead.id}`, icon: Inbox, kind: "Follow up", title: lead.name, detail: lead.business || lead.service, when: when(days), late: days < 0, href: `/admin/leads/${lead.id}` })
    }
    for (const p of projects.filter((p) => activeProjectStages.includes(p.stage) && p.daysLeft !== null && p.daysLeft <= 3)) {
      todos.push({ key: `p${p.id}`, icon: FolderKanban, kind: "Deadline", title: p.name, detail: `${clientName.get(p.clientId) ?? ""} · ${p.progress}% done`, when: when(p.daysLeft!), late: p.daysLeft! < 0, href: `/admin/projects/${p.id}` })
    }
    for (const rn of renewals.filter((rn) => rn.daysLeft <= 14)) {
      todos.push({ key: `r${rn.id}`, icon: RefreshCw, kind: "Renewal", title: rn.name, detail: `${renewalKindLabels[rn.kind]}${rn.clientId ? ` · ${clientName.get(rn.clientId) ?? ""}` : ""}`, when: when(rn.daysLeft), late: rn.daysLeft < 0, href: "/admin/renewals" })
    }
    for (const inv of invoices.filter((i) => i.state === "overdue")) {
      const days = Math.round((Date.parse(inv.dueDate) - Date.parse(r.today)) / 86_400_000)
      todos.push({ key: `i${inv.id}`, icon: Receipt, kind: "Overdue invoice", title: `${inv.number} · ${inv.billTo.business || inv.billTo.name}`, detail: `${formatMoney(inv.balance, inv.currency)} owed`, when: when(days), late: true, href: `/admin/invoices/${inv.id}` })
    }
    todos.sort((a, b) => Number(b.late) - Number(a.late))
  } catch (error) {
    console.error("Admin dashboard could not load", error)
    dbError = "Couldn't reach the database. Check MONGODB_URI and that Atlas allows connections from your host."
  }

  const on = features()
  const checks = [
    { label: "Database connected (MONGODB_URI)", ok: isDbConfigured() && !dbError },
    { label: "Separate session key (ADMIN_SESSION_SECRET), recommended", ok: Boolean(process.env.ADMIN_SESSION_SECRET) },
    { label: "AI replies: Groq (GROQ_API_KEY)", ok: on.groq },
    { label: "AI replies: Gemini fallback (GEMINI_API_KEY)", ok: on.gemini },
    { label: "Emails via Resend (RESEND_API_KEY, verified domain)", ok: on.email },
    { label: "Spam check: Cloudflare Turnstile (site + secret key)", ok: on.turnstile },
    { label: "Jira tasks (TASK_PROVIDER=jira + JIRA_* keys)", ok: on.jira },
    { label: "Daily digest, care plan invoices and reminders (CRON_SECRET, on Vercel)", ok: on.digest },
  ]
  const missing = checks.filter((c) => !c.ok).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-3xl text-forest">
            {greeting(hour)}, {user.name.split(" ").slice(-1)[0]}
          </h1>
          <p className="text-charcoal/80 mt-1">{new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "Asia/Karachi" }).format(new Date())}</p>
        </div>
        <Link href="/admin/reports" className={buttonClass.secondary}>
          All reports
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>

      {denied && <p role="alert" className="rounded-2xl bg-charcoal px-5 py-4 text-sm text-neutral">That page is for owners only.</p>}
      {(!isDbConfigured() || dbError) && (
        <div role="alert" className="rounded-2xl border border-sage/40 bg-mint/40 p-5 text-forest">
          <p className="font-semibold">Saving is turned off</p>
          <p className="text-sm mt-1">{dbError ?? "Add MONGODB_URI (and optionally MONGODB_DB) to your environment variables. Until then the site shows the default content from the code."}</p>
        </div>
      )}

      {report && (
        <>
          <section aria-label="Sales, last 30 days" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="New leads" value={String(report.leads.total)} delta={change(report.leads.total, report.leads.previous)} note="last 30 days" href="/admin/leads" />
            <Stat label="Open pipeline" value={perCurrency(report.leads.pipeline, "No values set")} note={`${report.leads.openCount} open leads`} href="/admin/leads" />
            <Stat label="Quotes waiting" value={String(report.quotes.waiting)} note={`${percent(report.quotes.acceptance)} accepted lately`} href="/admin/quotes?status=sent" />
            <Stat label="Won" value={String(report.leads.won)} note={`last 30 days · win rate ${percent(report.leads.winRate)}`} />
          </section>
          {report.money && (
            <section aria-label="Money" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Received" value={perCurrency(report.money.received)} note="last 30 days" href="/admin/invoices" />
              <Stat label="Owed to you" value={perCurrency(report.money.outstanding)} href="/admin/invoices" />
              <Stat label="Overdue" value={perCurrency(report.money.overdue)} href="/admin/invoices?state=overdue" />
              <Stat label="Care plans per month" value={perCurrency(report.money.mrr)} href="/admin/care-plans" />
            </section>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-6 items-start">
            <Card title="To do" description="Follow-ups, deadlines in the next 3 days, renewals in the next 2 weeks and overdue invoices.">
              {todos.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-sage-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" aria-hidden />
                  Nothing due. Nice.
                </p>
              ) : (
                <ul className="divide-y divide-sage/15">
                  {todos.slice(0, 15).map((t) => (
                    <li key={t.key}>
                      <Link href={t.href} className="py-3 flex items-start gap-3 group">
                        <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-mint/50 text-forest flex items-center justify-center">
                          <t.icon className="w-4 h-4" aria-hidden />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs text-charcoal/65">{t.kind}</span>
                          <span className="block font-semibold text-forest group-hover:underline underline-offset-2 truncate">{t.title}</span>
                          {t.detail && <span className="block text-xs text-charcoal/70 truncate">{t.detail}</span>}
                        </span>
                        <span className={`text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1 ${t.late ? "text-red-700" : "text-charcoal/70"}`}>
                          <CalendarClock className="w-3.5 h-3.5" aria-hidden />
                          {t.when}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {todos.length > 15 && <p className="text-sm text-charcoal/70 mt-2">And {todos.length - 15} more.</p>}
            </Card>
            <Card title="New leads per month" description="All sources, last 12 months.">
              <ColumnChart title="New leads per month" data={report.leads.byMonth} format="count" height={200} />
            </Card>
          </div>
        </>
      )}

      <details className="rounded-2xl border border-sage/25 bg-white" open={missing > 0 && !report?.leads.total}>
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-2 font-semibold text-forest [&::-webkit-details-marker]:hidden">
          Setup
          <span className="text-sm font-normal text-charcoal/70">{missing ? `${missing} item${missing === 1 ? "" : "s"} not set up` : "everything is set up"}</span>
        </summary>
        <div className="border-t border-sage/20 px-5 py-4">
          <p className="text-sm text-charcoal/80 mb-4">Anything not set up switches off quietly: without AI keys visitors get a fixed reply, without Resend no emails are sent. See README.md.</p>
          <ul className="space-y-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-2.5 text-sm">
                {check.ok ? <CheckCircle2 className="w-4 h-4 text-sage-600" aria-label="Done" /> : <XCircle className="w-4 h-4 text-charcoal" aria-label="Missing" />}
                {check.label}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  )
}
