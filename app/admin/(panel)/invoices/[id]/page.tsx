import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Ban, BellRing, ExternalLink, FileDown, Mail, Send, Trash2, X } from "lucide-react"
import { requireUser } from "@/lib/auth/current"
import { getInvoice, getQuote } from "@/lib/billing/store"
import { editorOptions } from "@/lib/billing/options"
import { invoiceUrl } from "@/lib/billing/send"
import { longDate, money, paymentMethodLabels } from "@/lib/billing/schemas"
import { pakistanDate } from "@/lib/crm/schemas"
import { deleteInvoiceAction, removePaymentAction, sendInvoiceAction, sendReminderAction, voidInvoiceAction } from "@/app/admin/actions/billing"
import { DocumentEditor } from "@/components/admin/billing/document-editor"
import { ActionButton, CopyLinkButton } from "@/components/admin/billing/action-button"
import { PaymentForm } from "@/components/admin/billing/payment-form"
import { InvoiceBadge } from "@/components/admin/billing/badges"
import { Card, buttonClass, dateTimeFormat } from "@/components/admin/ui"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const invoice = await getInvoice((await params).id)
  return { title: invoice ? `Invoice ${invoice.number}` : "Invoice" }
}

export default async function InvoicePage({ params }: Props) {
  await requireUser("owner")
  const invoice = await getInvoice((await params).id)
  if (!invoice) notFound()
  const [options, quote] = await Promise.all([editorOptions(), invoice.quoteId ? getQuote(invoice.quoteId) : null])
  const editable = invoice.status !== "void" && invoice.state !== "paid"
  const owed = invoice.balance > 0 && invoice.status !== "void"

  return (
    <>
      <Link href="/admin/invoices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Invoices
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <InvoiceBadge state={invoice.state} />
          {invoice.reminders.length > 0 && (
            <span className="text-xs text-charcoal/70">
              {invoice.reminders.length} reminder{invoice.reminders.length === 1 ? "" : "s"} sent
            </span>
          )}
        </div>
        <h1 className="font-heading font-bold text-3xl text-forest">Invoice {invoice.number}</h1>
        <p className="text-charcoal/80 mt-1">
          For {invoice.billTo.business || invoice.billTo.name} · total {money(invoice.total, invoice.currency)}
          {owed && (
            <>
              {" · "}
              <span className="font-semibold text-forest">{money(invoice.balance, invoice.currency)} owed</span>, due {longDate(invoice.dueDate)}
            </>
          )}
          {quote && (
            <>
              {" · "}
              <Link href={`/admin/quotes/${quote.id}`} className="underline underline-offset-2">
                quote {quote.number}
              </Link>
            </>
          )}
          {invoice.clientId && (
            <>
              {" · "}
              <Link href={`/admin/clients/${invoice.clientId}`} className="underline underline-offset-2">
                client
              </Link>
            </>
          )}
        </p>
      </div>

      <Card title="Send and share" className="mb-6">
        <div className="flex flex-wrap items-start gap-2">
          {invoice.status !== "void" && invoice.state !== "paid" && (
            <ActionButton
              variant="primary"
              label={invoice.status === "sent" ? "Email it again" : "Email to client"}
              icon={<Mail className="w-4 h-4" aria-hidden />}
              run={sendInvoiceAction.bind(null, invoice.id, true)}
              confirm={`Email invoice ${invoice.number} with the PDF to ${invoice.billTo.email || "(no email)"}?`}
              done="Sent."
            />
          )}
          {invoice.status === "draft" && <ActionButton label="Mark as sent" icon={<Send className="w-4 h-4" aria-hidden />} run={sendInvoiceAction.bind(null, invoice.id, false)} />}
          {invoice.status === "sent" && owed && (
            <ActionButton label="Send payment reminder" icon={<BellRing className="w-4 h-4" aria-hidden />} run={sendReminderAction.bind(null, invoice.id)} confirm={`Email a payment reminder to ${invoice.billTo.email}?`} done="Reminder sent." />
          )}
          {invoice.status !== "draft" && <CopyLinkButton url={invoiceUrl(invoice)} />}
          {invoice.status !== "draft" && (
            <a href={`/invoice/${invoice.token}`} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
              <ExternalLink className="w-4 h-4" aria-hidden />
              Client view
            </a>
          )}
          <a href={`/invoice/${invoice.token}/pdf`} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
            <FileDown className="w-4 h-4" aria-hidden />
            PDF
          </a>
          {invoice.status === "sent" && invoice.paid === 0 && (
            <ActionButton variant="danger" label="Void" icon={<Ban className="w-4 h-4" aria-hidden />} run={voidInvoiceAction.bind(null, invoice.id)} confirm={`Void invoice ${invoice.number}? The client's link will say it's cancelled.`} />
          )}
          {invoice.status === "draft" && (
            <ActionButton variant="danger" label="Delete draft" icon={<Trash2 className="w-4 h-4" aria-hidden />} run={deleteInvoiceAction.bind(null, invoice.id)} confirm={`Delete draft invoice ${invoice.number}?`} then="/admin/invoices" />
          )}
        </div>
        {(invoice.sentAt || invoice.viewedAt) && (
          <p className="mt-4 text-sm text-charcoal/75">
            {invoice.sentAt && `Sent ${dateTimeFormat.format(invoice.sentAt)}`}
            {invoice.viewedAt && ` · opened by the client ${dateTimeFormat.format(invoice.viewedAt)}`}
          </p>
        )}
      </Card>

      {invoice.status !== "void" && (
        <Card title="Payments" description="Record money as it arrives. The invoice shows as paid once the balance is zero." className="mb-6">
          {invoice.payments.length > 0 && (
            <ul className="divide-y divide-sage/15 mb-5">
              {invoice.payments.map((p) => (
                <li key={p.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-forest">{money(p.amount, invoice.currency)}</span>
                  <span>
                    {longDate(p.date)} · {paymentMethodLabels[p.method]}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </span>
                  <span className="text-xs text-charcoal/60">recorded by {p.recordedBy}</span>
                  <span className="ml-auto">
                    <ActionButton variant="quiet" label="Remove" icon={<X className="w-4 h-4" aria-hidden />} run={removePaymentAction.bind(null, invoice.id, p.id)} confirm="Remove this payment?" />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {owed ? <PaymentForm key={invoice.balance} invoiceId={invoice.id} balance={invoice.balance} currency={invoice.currency} today={pakistanDate()} /> : <p className="text-sm font-semibold text-sage-600">Paid in full.</p>}
        </Card>
      )}

      {editable ? (
        <DocumentEditor
          mode="invoice"
          docId={invoice.id}
          initial={{
            clientId: invoice.clientId,
            leadId: invoice.leadId,
            billTo: invoice.billTo,
            currency: invoice.currency,
            items: invoice.items,
            discount: invoice.discount,
            notes: invoice.notes,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
          }}
          {...options}
        />
      ) : (
        <p className="rounded-2xl border border-sage/30 bg-white p-5 text-sm text-charcoal/80">This invoice is {invoice.state} and can no longer be edited.</p>
      )}
    </>
  )
}
