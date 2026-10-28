import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireUser } from "@/lib/auth/current"
import { getClient } from "@/lib/crm/clients"
import { pakistanDate } from "@/lib/crm/schemas"
import { addDays, type InvoiceInput } from "@/lib/billing/schemas"
import { getBillingSettings } from "@/lib/billing/store"
import { editorOptions } from "@/lib/billing/options"
import { DocumentEditor } from "@/components/admin/billing/document-editor"
import { PageHeader } from "@/components/admin/ui"

export const metadata = { title: "New invoice" }

type Props = { searchParams: Promise<{ clientId?: string }> }

// An invoice not tied to a quote, e.g. a one-off change or a care plan month.
export default async function NewInvoicePage({ searchParams }: Props) {
  await requireUser("owner")
  const { clientId } = await searchParams
  const [settings, options, client] = await Promise.all([getBillingSettings(), editorOptions(), clientId ? getClient(clientId) : null])
  const today = pakistanDate()

  const initial: InvoiceInput = {
    clientId: client?.id ?? "",
    leadId: "",
    billTo: client ? { name: client.name, business: client.business, email: client.email, address: client.address } : { name: "", business: "", email: "", address: "" },
    currency: client?.currency ?? "PKR",
    items: [{ description: "", details: "", quantity: 1, unitPrice: 0 }],
    discount: 0,
    notes: "",
    issueDate: today,
    dueDate: addDays(today, settings.invoiceDueDays),
  }

  return (
    <>
      <Link href={client ? `/admin/clients/${client.id}` : "/admin/invoices"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {client ? client.business || client.name : "Invoices"}
      </Link>
      <PageHeader title="New invoice" description="For work that isn't on a quote. Invoices for a quote's deposit and balance are created from the quote." />
      <DocumentEditor mode="invoice" initial={initial} {...options} />
    </>
  )
}
