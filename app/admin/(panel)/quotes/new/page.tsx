import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getLead } from "@/lib/leads"
import { getClient } from "@/lib/crm/clients"
import { pakistanDate } from "@/lib/crm/schemas"
import { addDays, type QuoteInput } from "@/lib/billing/schemas"
import { getBillingSettings } from "@/lib/billing/store"
import { editorOptions } from "@/lib/billing/options"
import { DocumentEditor } from "@/components/admin/billing/document-editor"
import { PageHeader } from "@/components/admin/ui"

export const metadata = { title: "New quote" }

type Props = { searchParams: Promise<{ leadId?: string; clientId?: string }> }

// New quote, pre-filled from a lead or client when opened from their page.
export default async function NewQuotePage({ searchParams }: Props) {
  const { leadId, clientId } = await searchParams
  const [settings, options, lead, client] = await Promise.all([
    getBillingSettings(),
    editorOptions(),
    leadId ? getLead(leadId) : null,
    clientId ? getClient(clientId) : null,
  ])
  const linkedClient = client ?? (lead?.clientId ? await getClient(lead.clientId) : null)

  const initial: QuoteInput = {
    clientId: linkedClient?.id ?? "",
    leadId: lead?.id ?? "",
    billTo: linkedClient
      ? { name: linkedClient.name, business: linkedClient.business, email: linkedClient.email, address: linkedClient.address }
      : { name: lead?.name ?? "", business: lead?.business ?? "", email: lead?.email ?? "", address: "" },
    currency: linkedClient?.currency ?? lead?.value?.currency ?? (lead?.ipCountry && lead.ipCountry !== "PK" ? "USD" : "PKR"),
    title: lead?.service ? `${lead.service} for ${lead.business || lead.name}` : "",
    items: [{ description: "", details: "", quantity: 1, unitPrice: 0 }],
    discount: 0,
    notes: "",
    schedule: settings.defaultSchedule,
    validUntil: addDays(pakistanDate(), settings.quoteValidDays),
  }

  return (
    <>
      <Link href={lead ? `/admin/leads/${lead.id}` : "/admin/quotes"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {lead ? lead.name : "Quotes"}
      </Link>
      <PageHeader title="New quote" description="Add a package from your pricing, then any add-ons. The client gets a link to view and accept it." />
      <DocumentEditor mode="quote" initial={initial} {...options} />
    </>
  )
}
