import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, FileText, ImageIcon, Mail, MessageCircle, UserRound } from "lucide-react"
import { getLead, type DeliveryStatus } from "@/lib/leads"
import { listUsers } from "@/lib/auth/users"
import { getClient } from "@/lib/crm/clients"
import { listTimeline } from "@/lib/crm/timeline"
import { sourceLabels, whatsappLink } from "@/lib/crm/schemas"
import { contactServiceOptions } from "@/data/services"
import { listQuotes } from "@/lib/billing/store"
import { money } from "@/lib/billing/schemas"
import { QuoteBadge } from "@/components/admin/billing/badges"
import { LeadForm } from "@/components/admin/crm/lead-form"
import { Timeline } from "@/components/admin/crm/timeline"
import { ConvertButton } from "@/components/admin/crm/convert-button"
import { StageBadge } from "@/components/admin/crm/badges"
import { DeleteLeadButton } from "@/components/admin/delete-lead-button"
import { Badge, Card, buttonClass, dateTimeFormat } from "@/components/admin/ui"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const lead = await getLead((await params).id)
  return { title: lead?.name ?? "Lead" }
}

const delivery: Record<DeliveryStatus, string> = { sent: "sent", failed: "failed", skipped: "off" }

export default async function LeadPage({ params }: Props) {
  const lead = await getLead((await params).id)
  if (!lead) notFound()
  const [users, timeline, client, quotes] = await Promise.all([
    listUsers(),
    listTimeline("lead", lead.id),
    lead.clientId ? getClient(lead.clientId) : null,
    listQuotes({ leadId: lead.id }),
  ])
  const whatsapp = whatsappLink(lead.phone)
  const answers = lead.fields.filter(([, value]) => value)

  return (
    <>
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Leads
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StageBadge stage={lead.stage} />
            <Badge>{sourceLabels[lead.source]}</Badge>
            {lead.tags.map((tag) => (
              <Badge key={tag} tone="mint">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="font-heading font-bold text-3xl text-forest">{lead.name}</h1>
          <p className="text-charcoal/80 mt-1">
            {[lead.business, lead.service].filter(Boolean).join(" · ") || "No business or service yet"} · received {dateTimeFormat.format(lead.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lead.email && (
            <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Re: your enquiry to CodeMotive")}`} className={buttonClass.secondary}>
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
          {lead.stage !== "lost" && (
            <Link href={`/admin/quotes/new?leadId=${lead.id}`} className={buttonClass.secondary}>
              <FileText className="w-4 h-4" aria-hidden />
              New quote
            </Link>
          )}
          {client ? (
            <Link href={`/admin/clients/${client.id}`} className={buttonClass.primary}>
              <UserRound className="w-4 h-4" aria-hidden />
              Client: {client.business || client.name}
            </Link>
          ) : (
            lead.stage !== "lost" && <ConvertButton leadId={lead.id} name={lead.name} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Card title="Details">
            <LeadForm
              leadId={lead.id}
              users={users.filter((u) => u.active || u.id === lead.ownerId).map((u) => ({ id: u.id, name: u.name }))}
              serviceOptions={contactServiceOptions.filter((s) => s !== "Not sure")}
              initial={{
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                business: lead.business,
                service: lead.service,
                source: lead.source,
                stage: lead.stage,
                lostReason: lead.lostReason,
                value: lead.value,
                ownerId: lead.ownerId,
                followUpOn: lead.followUpOn,
                tags: lead.tags,
              }}
            />
          </Card>

          {quotes.length > 0 && (
            <Card title="Quotes">
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
              </ul>
            </Card>
          )}

          {lead.kind !== "manual" && (
            <Card title={lead.kind === "mockup" ? "Mockup request" : "Original enquiry"} description="As the visitor sent it. Times are Pakistan time.">
              <dl className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-x-4 gap-y-2 text-sm">
                {answers.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="font-semibold text-sage-600">{label}</dt>
                    <dd className="text-charcoal whitespace-pre-wrap break-words">{value}</dd>
                  </div>
                ))}
                <dt className="font-semibold text-sage-600">IP country</dt>
                <dd>{lead.ipCountry ?? "unknown"}</dd>
                <dt className="font-semibold text-sage-600">Emails</dt>
                <dd>
                  To us: {lead.ownerEmail ? delivery[lead.ownerEmail] : "pending"} · Copy to them: {lead.visitorEmail ? delivery[lead.visitorEmail] : "pending"}
                </dd>
              </dl>
              {lead.reply && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-forest mb-1.5">Instant reply they saw ({lead.replySource})</p>
                  <p className="rounded-xl bg-neutral p-4 text-sm leading-relaxed whitespace-pre-line">{lead.reply}</p>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {lead.taskUrl && (
                  <a href={lead.taskUrl} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
                    Jira issue
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                  </a>
                )}
                {lead.logoId && (
                  <a href={`/api/admin/uploads/${lead.logoId}`} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
                    <ImageIcon className="w-4 h-4" aria-hidden />
                    Their logo
                  </a>
                )}
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            <DeleteLeadButton id={lead.id} name={lead.name} redirectTo="/admin/leads" />
          </div>
        </div>

        <Card title="Timeline" description="Calls, messages and notes. Logging a call or message on a new lead moves it to Contacted.">
          <Timeline
            subject="lead"
            subjectId={lead.id}
            items={timeline.map((t) => ({ id: t.id, type: t.type, text: t.text, by: t.by, at: dateTimeFormat.format(t.at) }))}
          />
        </Card>
      </div>
    </>
  )
}
