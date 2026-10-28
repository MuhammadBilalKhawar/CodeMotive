import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Copy, ExternalLink, FileDown, FileText, FolderKanban, Mail, Send, ThumbsUp, Trash2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/current"
import { getInvoice, getQuote } from "@/lib/billing/store"
import { editorOptions } from "@/lib/billing/options"
import { quoteUrl } from "@/lib/billing/send"
import { money, splitTotal } from "@/lib/billing/schemas"
import { decideQuoteAction, deleteQuoteAction, duplicateQuoteAction, invoiceFromQuoteAction, sendQuoteAction } from "@/app/admin/actions/billing"
import { startProjectFromQuoteAction } from "@/app/admin/actions/delivery"
import { findProjectByQuote } from "@/lib/delivery/store"
import { DocumentEditor } from "@/components/admin/billing/document-editor"
import { ActionButton, CopyLinkButton } from "@/components/admin/billing/action-button"
import { DeclineQuoteButton } from "@/components/admin/billing/decline-button"
import { InvoiceBadge, QuoteBadge } from "@/components/admin/billing/badges"
import { Card, buttonClass, dateTimeFormat } from "@/components/admin/ui"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const quote = await getQuote((await params).id)
  return { title: quote ? `Quote ${quote.number}` : "Quote" }
}

export default async function QuotePage({ params }: Props) {
  const quote = await getQuote((await params).id)
  if (!quote) notFound()
  const [user, options] = await Promise.all([getCurrentUser(), editorOptions()])
  const owner = user?.role === "owner"
  const editable = quote.status === "draft" || quote.status === "sent"
  const link = quoteUrl(quote)
  const parts = splitTotal(quote.total, quote.schedule)
  const [invoices, project] = await Promise.all([
    Promise.all(parts.map((_, i) => (quote.invoiceIds[String(i)] ? getInvoice(quote.invoiceIds[String(i)]) : null))),
    findProjectByQuote(quote.id),
  ])

  const history: [string, Date | undefined][] = [
    ["Created", quote.createdAt],
    ["Sent", quote.sentAt],
    ["Opened by the client", quote.viewedAt],
    [quote.status === "declined" ? "Declined" : "Accepted", quote.decidedAt],
  ]

  return (
    <>
      <Link href="/admin/quotes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Quotes
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <QuoteBadge status={quote.status} expired={quote.expired} />
            <span className="text-sm text-charcoal/70">{quote.number}</span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-forest">{quote.title}</h1>
          <p className="text-charcoal/80 mt-1">
            For {quote.billTo.business || quote.billTo.name} · <span className="font-semibold text-forest">{money(quote.total, quote.currency)}</span>
            {quote.leadId && (
              <>
                {" · "}
                <Link href={`/admin/leads/${quote.leadId}`} className="underline underline-offset-2">
                  lead
                </Link>
              </>
            )}
            {quote.clientId && (
              <>
                {" · "}
                <Link href={`/admin/clients/${quote.clientId}`} className="underline underline-offset-2">
                  client
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <Card title="Send and share" className="mb-6">
        <div className="flex flex-wrap items-start gap-2">
          {editable && (
            <ActionButton
              variant="primary"
              label={quote.status === "sent" ? "Email it again" : "Email to client"}
              icon={<Mail className="w-4 h-4" aria-hidden />}
              run={sendQuoteAction.bind(null, quote.id, true)}
              confirm={`Email quote ${quote.number} with the PDF to ${quote.billTo.email || "(no email)"}?`}
              done="Sent."
            />
          )}
          {quote.status === "draft" && <ActionButton label="Mark as sent" icon={<Send className="w-4 h-4" aria-hidden />} run={sendQuoteAction.bind(null, quote.id, false)} />}
          {quote.status !== "draft" && <CopyLinkButton url={link} />}
          {quote.status !== "draft" && (
            <a href={`/quote/${quote.token}`} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
              <ExternalLink className="w-4 h-4" aria-hidden />
              Client view
            </a>
          )}
          <a href={`/quote/${quote.token}/pdf`} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
            <FileDown className="w-4 h-4" aria-hidden />
            PDF
          </a>
          {editable && (
            <ActionButton label="Mark accepted" icon={<ThumbsUp className="w-4 h-4" aria-hidden />} run={decideQuoteAction.bind(null, quote.id, "accepted", "")} confirm="Mark this quote as accepted? A lead becomes a client." />
          )}
          {editable && <DeclineQuoteButton quoteId={quote.id} />}
          {quote.status === "accepted" &&
            (project ? (
              <Link href={`/admin/projects/${project.id}`} className={buttonClass.primary}>
                <FolderKanban className="w-4 h-4" aria-hidden />
                Project: {project.name}
              </Link>
            ) : (
              <ActionButton variant="primary" label="Start project" icon={<FolderKanban className="w-4 h-4" aria-hidden />} run={startProjectFromQuoteAction.bind(null, quote.id)} thenToId="/admin/projects/" />
            ))}
          <ActionButton label="Duplicate" icon={<Copy className="w-4 h-4" aria-hidden />} run={duplicateQuoteAction.bind(null, quote.id)} thenToId="/admin/quotes/" />
          {quote.status === "draft" && (
            <ActionButton variant="danger" label="Delete draft" icon={<Trash2 className="w-4 h-4" aria-hidden />} run={deleteQuoteAction.bind(null, quote.id)} confirm={`Delete draft quote ${quote.number}?`} then="/admin/quotes" />
          )}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-charcoal/75">
          {history
            .filter(([, at]) => at)
            .map(([label, at]) => (
              <li key={label}>
                {label}: {dateTimeFormat.format(at!)}
              </li>
            ))}
          {quote.decidedBy && <li>By: {quote.decidedBy}</li>}
          {quote.declineReason && <li>Reason: {quote.declineReason}</li>}
        </ul>
      </Card>

      {quote.status === "accepted" && (
        <Card title="Invoices" description="One invoice per payment in the quote. Create each when it's due." className="mb-6">
          <ul className="divide-y divide-sage/15">
            {parts.map((part, i) => {
              const invoice = invoices[i]
              return (
                <li key={i} className="py-3 flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-forest">
                    {part.label} ({part.percent}%)
                  </span>
                  <span className="text-sm">{money(part.amount, quote.currency)}</span>
                  <span className="sm:ml-auto flex items-center gap-2">
                    {invoice ? (
                      <>
                        <InvoiceBadge state={invoice.state} />
                        {owner ? (
                          <Link href={`/admin/invoices/${invoice.id}`} className={buttonClass.quiet}>
                            {invoice.number}
                          </Link>
                        ) : (
                          <span className="text-sm">{invoice.number}</span>
                        )}
                      </>
                    ) : owner ? (
                      <ActionButton label="Create invoice" icon={<FileText className="w-4 h-4" aria-hidden />} run={invoiceFromQuoteAction.bind(null, quote.id, i)} thenToId="/admin/invoices/" />
                    ) : (
                      <span className="text-sm text-charcoal/70">Not invoiced yet (owners create invoices)</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {editable ? (
        <DocumentEditor mode="quote" docId={quote.id} initial={pickQuoteInput(quote)} {...options} />
      ) : (
        <p className="rounded-2xl border border-sage/30 bg-white p-5 text-sm text-charcoal/80">
          This quote is {quote.status} and can no longer be edited. Use <strong>Duplicate</strong> to make a new version, or open the client view to see it as they did.
        </p>
      )}
    </>
  )
}

const pickQuoteInput = (q: NonNullable<Awaited<ReturnType<typeof getQuote>>>) => ({
  clientId: q.clientId,
  leadId: q.leadId,
  billTo: q.billTo,
  currency: q.currency,
  items: q.items,
  discount: q.discount,
  notes: q.notes,
  title: q.title,
  validUntil: q.validUntil,
  schedule: q.schedule,
})
