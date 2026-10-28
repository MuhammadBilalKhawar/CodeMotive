import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { listClients } from "@/lib/crm/clients"
import { EmptyState, PageHeader, Badge, buttonClass, dateFormat } from "@/components/admin/ui"
import { inputClass } from "@/components/admin/fields"

export const metadata = { title: "Clients" }

type Props = { searchParams: Promise<{ q?: string; status?: string }> }

export default async function ClientsPage({ searchParams }: Props) {
  const { q, status } = await searchParams
  const statusFilter = status === "active" || status === "past" ? status : undefined
  const clients = await listClients({ q: q?.slice(0, 80), status: statusFilter })

  return (
    <>
      <PageHeader
        title="Clients"
        description="Businesses you've won. Convert a lead from its page, or add a client directly."
        actions={
          <Link href="/admin/clients/new" className={buttonClass.primary}>
            <Plus className="w-4 h-4" aria-hidden />
            Add client
          </Link>
        }
      />

      <form action="/admin/clients" className="mb-5 flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Search clients</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Name, business, email, phone" className={cn(inputClass, "pl-9 w-64")} />
        </label>
        <select name="status" defaultValue={statusFilter ?? ""} aria-label="Status" className={cn(inputClass, "w-auto")}>
          <option value="">Active and past</option>
          <option value="active">Active</option>
          <option value="past">Past</option>
        </select>
        <button type="submit" className={buttonClass.secondary}>
          Filter
        </button>
      </form>

      {clients.length === 0 ? (
        <EmptyState>{q || statusFilter ? "No clients match." : "No clients yet. When you win a lead, use “Won: make client” on its page."}</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sage/25 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral/70 text-left text-xs uppercase tracking-wider text-sage-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold">Currency</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/15">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-neutral/40">
                  <td className="px-4 py-3 min-w-[180px]">
                    <Link href={`/admin/clients/${c.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                      {c.business || c.name}
                    </Link>
                    {c.business && <span className="block text-xs text-charcoal/70">{c.name}</span>}
                  </td>
                  <td className="px-4 py-3 text-charcoal/85">
                    <span className="block break-all">{c.email}</span>
                    <span className="block text-xs">{c.phone}</span>
                  </td>
                  <td className="px-4 py-3">{c.country || "–"}</td>
                  <td className="px-4 py-3">{c.currency}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.status === "active" ? "mint" : "neutral"}>{c.status === "active" ? "Active" : "Past"}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{dateFormat.format(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
