import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { listQuotes } from "@/lib/billing/store"
import { money, quoteStatusLabels, quoteStatuses, type QuoteStatus } from "@/lib/billing/schemas"
import { QuoteBadge } from "@/components/admin/billing/badges"
import { EmptyState, PageHeader, buttonClass, dateFormat } from "@/components/admin/ui"
import { inputClass } from "@/components/admin/fields"

export const metadata = { title: "Quotes" }

type Props = { searchParams: Promise<{ q?: string; status?: string }> }

export default async function QuotesPage({ searchParams }: Props) {
  const { q, status } = await searchParams
  const statusFilter = quoteStatuses.includes(status as QuoteStatus) ? (status as QuoteStatus) : undefined
  const quotes = await listQuotes({ q: q?.slice(0, 80), status: statusFilter })

  return (
    <>
      <PageHeader
        title="Quotes"
        description="Package plus add-ons, with a payment split. Clients view and accept them on a private link."
        actions={
          <Link href="/admin/quotes/new" className={buttonClass.primary}>
            <Plus className="w-4 h-4" aria-hidden />
            New quote
          </Link>
        }
      />

      <form action="/admin/quotes" className="mb-5 flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Search quotes</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Number, title or client" className={cn(inputClass, "pl-9 w-64")} />
        </label>
        <select name="status" defaultValue={statusFilter ?? ""} aria-label="Status" className={cn(inputClass, "w-auto")}>
          <option value="">All statuses</option>
          {quoteStatuses.map((s) => (
            <option key={s} value={s}>
              {quoteStatusLabels[s]}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClass.secondary}>
          Filter
        </button>
      </form>

      {quotes.length === 0 ? (
        <EmptyState>{q || statusFilter ? "No quotes match." : "No quotes yet. Create one here, or from a lead's page."}</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sage/25 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral/70 text-left text-xs uppercase tracking-wider text-sage-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Quote</th>
                <th className="px-4 py-3 font-semibold">For</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold">Valid until</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/15">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-neutral/40">
                  <td className="px-4 py-3 min-w-[220px]">
                    <Link href={`/admin/quotes/${quote.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                      {quote.title}
                    </Link>
                    <span className="block text-xs text-charcoal/70">{quote.number}</span>
                  </td>
                  <td className="px-4 py-3">{quote.billTo.business || quote.billTo.name}</td>
                  <td className="px-4 py-3">
                    <QuoteBadge status={quote.status} expired={quote.expired} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">{money(quote.total, quote.currency)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{quote.validUntil}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{dateFormat.format(quote.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
