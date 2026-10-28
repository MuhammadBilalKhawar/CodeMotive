import Link from "next/link"
import { RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { listRenewals, type Renewal } from "@/lib/delivery/store"
import { deliveryOptions } from "@/lib/delivery/options"
import { addDays, money } from "@/lib/billing/schemas"
import { pakistanDate } from "@/lib/crm/schemas"
import { renewalKindLabels } from "@/lib/delivery/schemas"
import { deleteRenewalAction, markRenewedAction } from "@/app/admin/actions/delivery"
import { RenewalForm } from "@/components/admin/delivery/renewal-form"
import { ActionButton } from "@/components/admin/billing/action-button"
import { Card, EmptyState, PageHeader, buttonClass } from "@/components/admin/ui"

export const metadata = { title: "Renewals" }

type Props = { searchParams: Promise<{ clientId?: string; projectId?: string }> }

const when = (days: number) => (days < 0 ? `${-days} day${days === -1 ? "" : "s"} late` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`)

// Domains, hosting, SSL and subscriptions: the digest reminds you 30, 14, 7, 3 and 1 days before.
export default async function RenewalsPage({ searchParams }: Props) {
  const { clientId, projectId } = await searchParams
  const [renewals, options] = await Promise.all([listRenewals(), deliveryOptions()])
  const clientName = new Map(options.clients.map((c) => [c.id, c.name]))
  const groups: [string, Renewal[]][] = [
    ["Overdue", renewals.filter((r) => r.daysLeft < 0)],
    ["Next 30 days", renewals.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30)],
    ["Later", renewals.filter((r) => r.daysLeft > 30)],
  ]
  const client = options.clients.find((c) => c.id === clientId)

  return (
    <>
      <PageHeader title="Renewals" description="Domains, hosting, SSL and subscriptions. The morning digest reminds you 30, 14, 7, 3 and 1 days before, and every day once overdue." />

      {renewals.length === 0 ? (
        <EmptyState>Nothing tracked yet. Add each client&apos;s domain and hosting below.</EmptyState>
      ) : (
        <div className="space-y-6 mb-8">
          {groups
            .filter(([, list]) => list.length)
            .map(([title, list]) => (
              <section key={title}>
                <h2 className={cn("font-heading font-bold text-lg mb-2", title === "Overdue" ? "text-red-700" : "text-forest")}>
                  {title} ({list.length})
                </h2>
                <ul className="rounded-2xl border border-sage/25 bg-white divide-y divide-sage/15">
                  {list.map((r) => (
                    <li key={r.id} className="p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="min-w-[200px] flex-1">
                        <Link href={`/admin/renewals/${r.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                          {r.name}
                        </Link>
                        <p className="text-xs text-charcoal/70">
                          {[renewalKindLabels[r.kind], r.clientId ? clientName.get(r.clientId) : "Ours", r.provider, r.cost !== null ? money(r.cost, r.currency) : "", r.paidBy === "client" ? "client pays" : "we pay", r.autoRenew ? "auto-renews" : ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="text-sm text-right">
                        <p className="font-semibold">{r.renewsOn}</p>
                        <p className={cn("text-xs", r.daysLeft < 0 ? "text-red-700 font-semibold" : "text-charcoal/70")}>{when(r.daysLeft)}</p>
                      </div>
                      <div className="flex gap-2">
                        <ActionButton label="Renewed" icon={<RefreshCw className="w-4 h-4" aria-hidden />} run={markRenewedAction.bind(null, r.id)} confirm={`Mark ${r.name} renewed for another year?`} />
                        <ActionButton variant="quiet" label="Delete" icon={<Trash2 className="w-4 h-4" aria-hidden />} run={deleteRenewalAction.bind(null, r.id)} confirm={`Stop tracking ${r.name}?`} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      <div id="add" className="scroll-mt-24">
        <Card title="Add a renewal" description={client ? `For ${client.name}.` : undefined}>
          <RenewalForm
            clients={options.clients}
            projects={options.projects}
            initial={{
              clientId: client?.id ?? "",
              projectId: options.projects.some((p) => p.id === projectId) ? projectId! : "",
              kind: "domain",
              name: "",
              provider: "",
              renewsOn: addDays(pakistanDate(), 365),
              cost: null,
              currency: client?.currency ?? "PKR",
              paidBy: "client",
              autoRenew: false,
              notes: "",
            }}
          />
        </Card>
      </div>
      {client && (
        <p className="mt-4 text-sm">
          <Link href={`/admin/clients/${client.id}`} className={buttonClass.quiet}>
            Back to {client.name}
          </Link>
        </p>
      )}
    </>
  )
}
