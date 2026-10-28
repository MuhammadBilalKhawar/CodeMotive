import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { requireUser } from "@/lib/auth/current"
import { listInvoices } from "@/lib/billing/store"
import { invoiceStateLabels, longDate, money, type InvoiceState } from "@/lib/billing/schemas"
import { pakistanDate } from "@/lib/crm/schemas"
import { InvoiceBadge } from "@/components/admin/billing/badges"
import { EmptyState, PageHeader, buttonClass } from "@/components/admin/ui"
import { inputClass } from "@/components/admin/fields"

export const metadata = { title: "Invoices" }

type Props = { searchParams: Promise<{ q?: string; state?: string }> }

const states: InvoiceState[] = ["draft", "unpaid", "partial", "overdue", "paid", "void"]

// Owners only: money owed and received.
export default async function InvoicesPage({ searchParams }: Props) {
  await requireUser("owner")
  const { q, state } = await searchParams
  const stateFilter = states.includes(state as InvoiceState) ? (state as InvoiceState) : undefined
  const all = await listInvoices({ q: q?.slice(0, 80) })
  const invoices = stateFilter ? all.filter((i) => i.state === stateFilter) : all

  // Totals per currency (never add rupees and dollars together).
  const month = pakistanDate().slice(0, 7)
  const sum = (pick: (i: (typeof all)[number]) => number, currency: "PKR" | "USD") => all.filter((i) => i.currency === currency).reduce((total, i) => total + pick(i), 0)
  const owed = (i: (typeof all)[number]) => (i.state === "unpaid" || i.state === "partial" || i.state === "overdue" ? i.balance : 0)
  const late = (i: (typeof all)[number]) => (i.state === "overdue" ? i.balance : 0)
  const thisMonth = (i: (typeof all)[number]) => i.payments.filter((p) => p.date.startsWith(month)).reduce((total, p) => total + p.amount, 0)
  const both = (pick: (i: (typeof all)[number]) => number) =>
    (["PKR", "USD"] as const)
      .map((c) => [c, sum(pick, c)] as const)
      .filter(([, amount]) => amount > 0)
      .map(([c, amount]) => money(amount, c))
      .join(" + ") || "Nothing"

  const summary = [
    { label: "Owed to you", value: both(owed) },
    { label: "Overdue", value: both(late) },
    { label: "Received this month", value: both(thisMonth) },
  ]

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create them from an accepted quote (deposit, balance) or by hand. Record payments as they arrive."
        actions={
          <Link href="/admin/invoices/new" className={buttonClass.primary}>
            <Plus className="w-4 h-4" aria-hidden />
            New invoice
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-sage/25 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">{s.label}</p>
            <p className="font-heading font-bold text-xl text-forest mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <form action="/admin/invoices" className="mb-5 flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Search invoices</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Number or client" className={cn(inputClass, "pl-9 w-64")} />
        </label>
        <select name="state" defaultValue={stateFilter ?? ""} aria-label="Status" className={cn(inputClass, "w-auto")}>
          <option value="">All statuses</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {invoiceStateLabels[s]}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClass.secondary}>
          Filter
        </button>
      </form>

      {invoices.length === 0 ? (
        <EmptyState>{q || stateFilter ? "No invoices match." : "No invoices yet. Accept a quote, then create its deposit invoice from the quote page."}</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sage/25 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral/70 text-left text-xs uppercase tracking-wider text-sage-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Invoice</th>
                <th className="px-4 py-3 font-semibold">For</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-right">Still owed</th>
                <th className="px-4 py-3 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/15">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-neutral/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/invoices/${invoice.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">{invoice.billTo.business || invoice.billTo.name}</td>
                  <td className="px-4 py-3">
                    <InvoiceBadge state={invoice.state} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{money(invoice.total, invoice.currency)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">{invoice.state === "void" ? "–" : money(invoice.balance, invoice.currency)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{longDate(invoice.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
