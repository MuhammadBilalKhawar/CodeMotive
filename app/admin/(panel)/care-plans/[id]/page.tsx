import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, Trash2 } from "lucide-react"
import { requireUser } from "@/lib/auth/current"
import { getCarePlan } from "@/lib/delivery/store"
import { deliveryOptions } from "@/lib/delivery/options"
import { getInvoice } from "@/lib/billing/store"
import { longDate, money } from "@/lib/billing/schemas"
import { deleteCarePlanAction, invoiceCarePlanNowAction } from "@/app/admin/actions/delivery"
import { CarePlanForm } from "@/components/admin/delivery/care-plan-form"
import { ActionButton } from "@/components/admin/billing/action-button"
import { InvoiceBadge } from "@/components/admin/billing/badges"
import { Card } from "@/components/admin/ui"

type Props = { params: Promise<{ id: string }> }

export const metadata = { title: "Care plan" }

export default async function CarePlanPage({ params }: Props) {
  await requireUser("owner")
  const plan = await getCarePlan((await params).id)
  if (!plan) notFound()
  const [options, invoices] = await Promise.all([deliveryOptions(), Promise.all([...plan.invoiceIds].reverse().slice(0, 24).map(getInvoice))])
  const client = options.clients.find((c) => c.id === plan.clientId)

  return (
    <>
      <Link href="/admin/care-plans" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Care plans
      </Link>
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-forest">{plan.name}</h1>
          <p className="text-charcoal/80 mt-1">
            {client ? (
              <Link href={`/admin/clients/${client.id}`} className="underline underline-offset-2">
                {client.name}
              </Link>
            ) : (
              "Unknown client"
            )}{" "}
            · {money(plan.amount, plan.currency)} a {plan.interval === "monthly" ? "month" : "year"}
            {plan.status === "active" && ` · next invoice ${longDate(plan.nextInvoiceOn)}`}
          </p>
        </div>
        {plan.status === "active" && (
          <ActionButton
            variant="primary"
            label="Invoice the next period now"
            icon={<FileText className="w-4 h-4" aria-hidden />}
            run={invoiceCarePlanNowAction.bind(null, plan.id)}
            confirm={`Create the invoice for the period starting ${plan.nextInvoiceOn} now? The next date moves on.`}
            thenToId="/admin/invoices/"
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-6 items-start">
        <Card title="Plan">
          <CarePlanForm
            planId={plan.id}
            {...options}
            initial={{
              clientId: plan.clientId,
              projectId: plan.projectId,
              name: plan.name,
              description: plan.description,
              amount: plan.amount,
              currency: plan.currency,
              interval: plan.interval,
              nextInvoiceOn: plan.nextInvoiceOn,
              status: plan.status,
              invoiceMode: plan.invoiceMode,
            }}
          />
        </Card>
        <div className="space-y-6">
          <Card title="Invoices" description="Newest first.">
            {invoices.filter(Boolean).length === 0 ? (
              <p className="text-sm text-charcoal/70">None yet.</p>
            ) : (
              <ul className="divide-y divide-sage/15">
                {invoices.map(
                  (invoice) =>
                    invoice && (
                      <li key={invoice.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <Link href={`/admin/invoices/${invoice.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                          {invoice.number}
                        </Link>
                        <InvoiceBadge state={invoice.state} />
                        <span className="ml-auto">{longDate(invoice.issueDate)}</span>
                      </li>
                    ),
                )}
              </ul>
            )}
          </Card>
          <div className="flex justify-end">
            <ActionButton variant="danger" label="Delete care plan" icon={<Trash2 className="w-4 h-4" aria-hidden />} run={deleteCarePlanAction.bind(null, plan.id)} confirm="Delete this care plan? Its invoices are kept. (To stop billing but keep the record, set it to Cancelled.)" then="/admin/care-plans" />
          </div>
        </div>
      </div>
    </>
  )
}
