import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireUser } from "@/lib/auth/current"
import { pakistanDate } from "@/lib/crm/schemas"
import { deliveryOptions } from "@/lib/delivery/options"
import { CarePlanForm } from "@/components/admin/delivery/care-plan-form"
import { Card, EmptyState, PageHeader } from "@/components/admin/ui"

export const metadata = { title: "New care plan" }

type Props = { searchParams: Promise<{ clientId?: string; projectId?: string }> }

export default async function NewCarePlanPage({ searchParams }: Props) {
  await requireUser("owner")
  const { clientId, projectId } = await searchParams
  const options = await deliveryOptions()
  const client = options.clients.find((c) => c.id === clientId)

  return (
    <>
      <Link href="/admin/care-plans" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Care plans
      </Link>
      <PageHeader title="New care plan" description="Hosting, updates and small edits for a client, billed every month or year." />
      {options.clients.length === 0 ? (
        <EmptyState>Care plans belong to a client. Add a client first.</EmptyState>
      ) : (
        <Card className="max-w-3xl">
          <CarePlanForm
            {...options}
            initial={{
              clientId: client?.id ?? "",
              projectId: options.projects.some((p) => p.id === projectId) ? projectId! : "",
              name: "",
              description: "",
              amount: 0,
              currency: client?.currency ?? "PKR",
              interval: "monthly",
              nextInvoiceOn: pakistanDate(),
              status: "active",
              invoiceMode: "draft",
            }}
          />
        </Card>
      )}
    </>
  )
}
