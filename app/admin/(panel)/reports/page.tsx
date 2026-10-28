import Link from "next/link"
import { cn } from "@/lib/utils"
import { requireUser } from "@/lib/auth/current"
import { loadReport, reportRanges } from "@/lib/reports"
import { change } from "@/lib/reports/compute"
import { stageLabels } from "@/lib/crm/schemas"
import { BarList, ColumnChart } from "@/components/admin/reports/charts"
import { Stat, percent, perCurrency } from "@/components/admin/reports/stat"
import { Card, PageHeader, dateTimeFormat } from "@/components/admin/ui"

export const metadata = { title: "Reports" }

type Props = { searchParams: Promise<{ range?: string }> }

export default async function ReportsPage({ searchParams }: Props) {
  const user = await requireUser()
  const owner = user.role === "owner"
  const { range } = await searchParams
  const days = reportRanges.find((r) => String(r.days) === range)?.days ?? 90
  const report = await loadReport(days, { money: owner })
  const { leads, quotes, money, chat } = report
  const rangeLabel = reportRanges.find((r) => r.days === days)!.label.toLowerCase()

  return (
    <>
      <PageHeader title="Reports" description="Where leads come from, how many you win, what's been paid, and what visitors ask the chat." />

      {/* One filter row; it scopes every number below. */}
      <nav aria-label="Period" className="mb-6 flex flex-wrap gap-1.5">
        {reportRanges.map((r) => (
          <Link
            key={r.days}
            href={`/admin/reports?range=${r.days}`}
            aria-current={r.days === days ? "page" : undefined}
            className={cn("rounded-full border px-3 py-1 text-sm font-semibold", r.days === days ? "border-forest bg-forest text-neutral" : "border-sage/40 bg-white text-forest")}
          >
            {r.label}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="leads-h" className="space-y-4">
        <h2 id="leads-h" className="font-heading font-bold text-xl text-forest">
          Leads
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="New leads" value={String(leads.total)} delta={change(leads.total, leads.previous)} note={`${rangeLabel}`} />
          <Stat label="Won" value={String(leads.won)} note={`conversion ${percent(leads.conversion)}`} />
          <Stat label="Win rate" value={percent(leads.winRate)} note={`${leads.won} won, ${leads.lost} lost`} />
          <Stat label="Open pipeline" value={perCurrency(leads.pipeline, "No values set")} note={`${leads.openCount} open leads`} href="/admin/leads" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
          <Card title="New leads per month" description="All sources, last 12 months.">
            <ColumnChart title="New leads per month" data={leads.byMonth} format="count" />
          </Card>
          <Card title="Where they came from" description={`Leads ${rangeLabel}, and how many were won.`}>
            <BarList
              labelHeader="Source"
              data={leads.bySource.map((s) => ({ label: s.label, value: s.total }))}
              notes={Object.fromEntries(leads.bySource.map((s) => [s.label, `${s.won} won · ${percent(s.total ? s.won / s.total : null)}`]))}
            />
          </Card>
        </div>
        <Card title="Where those leads are now" description={`Current stage of the leads that came in ${rangeLabel}.`}>
          <BarList labelHeader="Stage" data={leads.stageCounts.map((s) => ({ label: stageLabels[s.stage], value: s.count }))} />
        </Card>
      </section>

      <section aria-labelledby="quotes-h" className="mt-10 space-y-4">
        <h2 id="quotes-h" className="font-heading font-bold text-xl text-forest">
          Quotes
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Sent" value={String(quotes.sent)} note={rangeLabel} />
          <Stat label="Accepted" value={String(quotes.accepted)} note={`${quotes.declined} declined`} />
          <Stat label="Acceptance rate" value={percent(quotes.acceptance)} />
          <Stat label="Accepted value" value={perCurrency(quotes.acceptedValue)} note={`${quotes.waiting} waiting for an answer`} href="/admin/quotes?status=sent" />
        </div>
      </section>

      {money && (
        <section aria-labelledby="money-h" className="mt-10 space-y-4">
          <h2 id="money-h" className="font-heading font-bold text-xl text-forest">
            Money
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Received" value={perCurrency(money.received)} note={rangeLabel} />
            <Stat label="Owed to you" value={perCurrency(money.outstanding)} href="/admin/invoices" />
            <Stat label="Overdue" value={perCurrency(money.overdue)} href="/admin/invoices?state=overdue" />
            <Stat label="Care plans per month" value={perCurrency(money.mrr)} href="/admin/care-plans" />
          </div>
          {/* Rupees and dollars on separate charts: never one chart with two scales. */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card title="Payments received (PKR)" description="By the date recorded, last 12 months.">
              <ColumnChart title="Payments received in PKR per month" data={money.byMonth.PKR} format="PKR" />
            </Card>
            <Card title="Payments received (USD)" description="By the date recorded, last 12 months.">
              <ColumnChart title="Payments received in USD per month" data={money.byMonth.USD} format="USD" />
            </Card>
          </div>
        </section>
      )}

      <section aria-labelledby="chat-h" className="mt-10 space-y-4">
        <h2 id="chat-h" className="font-heading font-bold text-xl text-forest">
          What visitors ask the chat
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Questions" value={String(chat.total)} note={rangeLabel} />
          <Stat label="Not answered by the AI" value={String(chat.unansweredCount)} note="add the missing facts under AI assistant" href="/admin/website/ai" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.3fr] gap-4">
          <Card title="Topics" description="Grouped by keywords (English and Roman Urdu).">
            <BarList labelHeader="Topic" data={chat.topics} />
          </Card>
          <Card title="Questions the AI couldn't answer" description="It sent these visitors to the contact form or WhatsApp instead.">
            <QuestionList items={chat.unanswered} empty="None. The AI answered everything." />
          </Card>
        </div>
        <Card title="Latest questions" description="Kept for 90 days, without names or contact details.">
          <QuestionList items={chat.recent} empty="No chat questions yet." />
        </Card>
      </section>
    </>
  )
}

function QuestionList({ items, empty }: { items: { at: Date; question: string; answered: boolean }[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-charcoal/70">{empty}</p>
  return (
    <ul className="divide-y divide-sage/15">
      {items.map((q, i) => (
        <li key={i} className="py-2.5 text-sm">
          <p className="text-charcoal break-words">{q.question}</p>
          <p className="text-xs text-charcoal/60 mt-0.5">
            {dateTimeFormat.format(q.at)}
            {!q.answered && " · not answered"}
          </p>
        </li>
      ))}
    </ul>
  )
}
