import Link from "next/link"
import { Plus } from "lucide-react"
import { requireUser } from "@/lib/auth/current"
import { listCarePlans } from "@/lib/delivery/store"
import { listClients } from "@/lib/crm/clients"
import { money } from "@/lib/billing/schemas"
import { Badge, EmptyState, PageHeader, buttonClass } from "@/components/admin/ui"

export const metadata = { title: "Care plans" }

// Owners only: recurring income from hosting, updates and edits.
export default async function CarePlansPage() {
  await requireUser("owner")
  const [plans, clients] = await Promise.all([listCarePlans(), listClients()])
  const clientName = new Map(clients.map((c) => [c.id, c.business || c.name]))
  const active = plans.filter((p) => p.status === "active")
  // Monthly recurring revenue, per currency (yearly plans count as 1/12).
  const mrr = (["PKR", "USD"] as const)
    .map((c) => [c, Math.round(active.filter((p) => p.currency === c).reduce((sum, p) => sum + (p.interval === "yearly" ? p.amount / 12 : p.amount), 0))] as const)
    .filter(([, amount]) => amount > 0)

  return (
    <>
      <PageHeader
        title="Care plans"
        description="Monthly or yearly plans. On each plan's date the daily job creates the invoice, as a draft or sent straight to the client."
        actions={
          <Link href="/admin/care-plans/new" className={buttonClass.primary}>
            <Plus className="w-4 h-4" aria-hidden />
            New care plan
          </Link>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-sage/25 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">Active plans</p>
          <p className="font-heading font-bold text-xl text-forest mt-1">{active.length}</p>
        </div>
        <div className="rounded-2xl border border-sage/25 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">Monthly recurring income</p>
          <p className="font-heading font-bold text-xl text-forest mt-1">{mrr.length ? mrr.map(([c, a]) => money(a, c)).join(" + ") : "Nothing yet"}</p>
        </div>
      </div>

      {plans.length === 0 ? (
        <EmptyState>No care plans yet. Add one for a client after launch.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sage/25 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral/70 text-left text-xs uppercase tracking-wider text-sage-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold text-right">Price</th>
                <th className="px-4 py-3 font-semibold">Next invoice</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/15">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-neutral/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/care-plans/${p.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{clientName.get(p.clientId) ?? "–"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {money(p.amount, p.currency)} / {p.interval === "monthly" ? "month" : "year"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{p.status === "active" ? p.nextInvoiceOn : "–"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === "active" ? "mint" : p.status === "paused" ? "neutral" : "warn"}>{p.status === "active" ? "Active" : p.status === "paused" ? "Paused" : "Cancelled"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
