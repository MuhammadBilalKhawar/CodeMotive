import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, FolderKanban, Mail, MessageCircle, Receipt } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/current"
import { getClient } from "@/lib/crm/clients"
import { listLeads } from "@/lib/leads"
import { listTimeline } from "@/lib/crm/timeline"
import { formatMoney, whatsappLink } from "@/lib/crm/schemas"
import { listInvoices, listQuotes } from "@/lib/billing/store"
import { money } from "@/lib/billing/schemas"
import { InvoiceBadge, QuoteBadge } from "@/components/admin/billing/badges"
import { listCarePlans, listProjects, listRenewals } from "@/lib/delivery/store"
import { renewalKindLabels } from "@/lib/delivery/schemas"
import { ProjectStageBadge } from "@/components/admin/delivery/badges"
import { ClientForm } from "@/components/admin/crm/client-form"
import { Timeline } from "@/components/admin/crm/timeline"
import { StageBadge } from "@/components/admin/crm/badges"
import { Badge, Card, buttonClass, dateFormat, dateTimeFormat } from "@/components/admin/ui"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const client = await getClient((await params).id)
  return { title: client ? client.business || client.name : "Client" }
}

export default async function ClientPage({ params }: Props) {
  const client = await getClient((await params).id)
  if (!client) notFound()
  const [leads, timeline, me, quotes] = await Promise.all([listLeads({ clientId: client.id }), listTimeline("client", client.id), getCurrentUser(), listQuotes({ clientId: client.id })])
  const owner = me?.role === "owner"
  const [invoices, projects, renewals, carePlans] = await Promise.all([
    owner ? listInvoices({ clientId: client.id }) : [],
    listProjects({ clientId: client.id }),
    listRenewals({ clientId: client.id }),
    owner ? listCarePlans({ clientId: client.id }) : [],
  ])
  const whatsapp = whatsappLink(client.phone)
  const { id: _id, createdAt, updatedAt: _updated, createdBy: _by, ...input } = client

  return (
    <>
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Clients
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2 mb-1">
            <Badge tone={client.status === "active" ? "mint" : "neutral"}>{client.status === "active" ? "Active client" : "Past client"}</Badge>
            {client.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <h1 className="font-heading font-bold text-3xl text-forest">{client.business || client.name}</h1>
          <p className="text-charcoal/80 mt-1">
            {client.business ? `${client.name} · ` : ""}client since {dateFormat.format(createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/projects/new?clientId=${client.id}`} className={buttonClass.secondary}>
            <FolderKanban className="w-4 h-4" aria-hidden />
            New project
          </Link>
          <Link href={`/admin/quotes/new?clientId=${client.id}`} className={buttonClass.secondary}>
            <FileText className="w-4 h-4" aria-hidden />
            New quote
          </Link>
          {owner && (
            <Link href={`/admin/invoices/new?clientId=${client.id}`} className={buttonClass.secondary}>
              <Receipt className="w-4 h-4" aria-hidden />
              New invoice
            </Link>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className={buttonClass.secondary}>
              <Mail className="w-4 h-4" aria-hidden />
              Email
            </a>
          )}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
              <MessageCircle className="w-4 h-4" aria-hidden />
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Card title="Details">
            <ClientForm clientId={client.id} initial={input} canDelete={owner} />
          </Card>
          {(quotes.length > 0 || invoices.length > 0) && (
            <Card title="Quotes and invoices">
              <ul className="divide-y divide-sage/15">
                {quotes.map((quote) => (
                  <li key={quote.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`/admin/quotes/${quote.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                      {quote.number}
                    </Link>
                    <QuoteBadge status={quote.status} expired={quote.expired} />
                    <span className="text-sm">{quote.title}</span>
                    <span className="text-sm font-semibold text-forest sm:ml-auto">{money(quote.total, quote.currency)}</span>
                  </li>
                ))}
                {invoices.map((invoice) => (
                  <li key={invoice.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`/admin/invoices/${invoice.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                      {invoice.number}
                    </Link>
                    <InvoiceBadge state={invoice.state} />
                    <span className="text-sm font-semibold text-forest sm:ml-auto">
                      {invoice.balance > 0 && invoice.state !== "void" ? `${money(invoice.balance, invoice.currency)} owed` : money(invoice.total, invoice.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="Projects, care plans and renewals">
            {projects.length + renewals.length + carePlans.length === 0 && <p className="text-sm text-charcoal/70 mb-3">Nothing yet.</p>}
            <ul className="divide-y divide-sage/15">
              {projects.map((p) => (
                <li key={p.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link href={`/admin/projects/${p.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                    {p.name}
                  </Link>
                  <ProjectStageBadge stage={p.stage} />
                  <span className="text-sm text-charcoal/70 sm:ml-auto">{p.progress}% done</span>
                </li>
              ))}
              {carePlans.map((plan) => (
                <li key={plan.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link href={`/admin/care-plans/${plan.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                    {plan.name}
                  </Link>
                  <span className="text-sm">
                    {money(plan.amount, plan.currency)} / {plan.interval === "monthly" ? "month" : "year"} · {plan.status}
                  </span>
                </li>
              ))}
              {renewals.map((r) => (
                <li key={r.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Link href={`/admin/renewals/${r.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                    {r.name}
                  </Link>
                  <span>{renewalKindLabels[r.kind]}</span>
                  <span className={`sm:ml-auto ${r.daysLeft < 0 ? "font-semibold text-red-700" : "text-charcoal/70"}`}>renews {r.renewsOn}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {owner && (
                <Link href={`/admin/care-plans/new?clientId=${client.id}`} className={buttonClass.quiet}>
                  Add a care plan
                </Link>
              )}
              <Link href={`/admin/renewals?clientId=${client.id}#add`} className={buttonClass.quiet}>
                Add a renewal
              </Link>
            </div>
          </Card>
          <Card title="Leads" description="Enquiries linked to this client.">
            {leads.length === 0 ? (
              <p className="text-sm text-charcoal/70">No linked leads.</p>
            ) : (
              <ul className="divide-y divide-sage/15">
                {leads.map((lead) => (
                  <li key={lead.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                      {lead.service || lead.name}
                    </Link>
                    <StageBadge stage={lead.stage} />
                    {lead.value && <span className="text-sm font-semibold text-forest">{formatMoney(lead.value)}</span>}
                    <span className="text-sm text-charcoal/70 sm:ml-auto">{dateFormat.format(lead.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card title="Timeline">
          <Timeline subject="client" subjectId={client.id} items={timeline.map((t) => ({ id: t.id, type: t.type, text: t.text, by: t.by, at: dateTimeFormat.format(t.at) }))} />
        </Card>
      </div>
    </>
  )
}
