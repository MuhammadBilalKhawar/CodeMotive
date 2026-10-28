import { notFound } from "next/navigation"
import { Download } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/current"
import { getBillingSettings, getInvoiceByToken, updateInvoice } from "@/lib/billing/store"
import { invoiceStateLabels, longDate, money } from "@/lib/billing/schemas"
import { DocumentView, PaymentsList, TextBlock } from "@/components/billing/document-view"

type Props = { params: Promise<{ token: string }> }

export const dynamic = "force-dynamic"
export const metadata = { title: "Your invoice", robots: { index: false, follow: false } }

// The client's invoice link: amount due, how to pay, payments received, PDF.
export default async function InvoicePage({ params }: Props) {
  const { token } = await params
  const invoice = await getInvoiceByToken(token)
  if (!invoice || invoice.status === "draft") notFound()
  const [settings, admin] = await Promise.all([getBillingSettings(), getCurrentUser()])
  if (!invoice.viewedAt && !admin) await updateInvoice(invoice.id, { viewedAt: new Date() })

  const instructions = invoice.currency === "PKR" ? settings.pkrInstructions : settings.usdInstructions
  const totals: [string, string][] = invoice.paid > 0 ? [["Paid", money(invoice.paid, invoice.currency)], ["Balance due", money(invoice.balance, invoice.currency)]] : []

  return (
    <main className="min-h-screen bg-neutral px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-charcoal/80">
            Status: <span className="font-semibold text-forest">{invoiceStateLabels[invoice.state]}</span>
            {invoice.balance > 0 && invoice.state !== "void" && ` · ${money(invoice.balance, invoice.currency)} due ${longDate(invoice.dueDate)}`}
          </p>
          <a href={`/invoice/${token}/pdf`} className="inline-flex items-center gap-2 rounded-lg border border-sage/40 bg-white px-4 py-2 text-sm font-semibold text-forest">
            <Download className="w-4 h-4" aria-hidden />
            Download PDF
          </a>
        </div>

        {invoice.state === "void" && <p className="rounded-2xl bg-charcoal text-neutral p-5 text-sm">This invoice has been cancelled. Nothing is owed on it.</p>}

        <DocumentView
          kind="Invoice"
          number={invoice.number}
          dates={[
            ["Issued", longDate(invoice.issueDate)],
            ["Due", longDate(invoice.dueDate)],
          ]}
          settings={settings}
          billTo={invoice.billTo}
          items={invoice.items}
          currency={invoice.currency}
          discount={invoice.discount}
          totals={totals}
        >
          <PaymentsList payments={invoice.payments} currency={invoice.currency} />
          {invoice.balance > 0 && invoice.state !== "void" && instructions && (
            <section className="mt-8 rounded-2xl bg-neutral p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">How to pay</h2>
              <div className="space-y-1 text-sm">
                {instructions
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
              </div>
              <p className="mt-3 text-sm font-semibold">Please use {invoice.number} as the payment reference.</p>
            </section>
          )}
          <TextBlock title="Notes" text={invoice.notes} />
          {settings.invoiceFooter && <p className="mt-8 text-sm text-sage-600">{settings.invoiceFooter}</p>}
        </DocumentView>
      </div>
    </main>
  )
}
