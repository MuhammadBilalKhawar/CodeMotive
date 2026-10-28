import { notFound } from "next/navigation"
import { Download } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/current"
import { getBillingSettings, getQuoteByToken, updateQuote } from "@/lib/billing/store"
import { longDate, money, quoteStatusLabels, splitTotal } from "@/lib/billing/schemas"
import { addTimeline } from "@/lib/crm/timeline"
import { pakistanDate } from "@/lib/crm/schemas"
import { DocumentView, TextBlock } from "@/components/billing/document-view"
import { QuoteAnswer } from "@/components/billing/quote-answer"

type Props = { params: Promise<{ token: string }> }

export const dynamic = "force-dynamic"
export const metadata = { title: "Your quote", robots: { index: false, follow: false } }

// The client's quote link: view, download the PDF, accept or decline.
export default async function QuotePage({ params }: Props) {
  const { token } = await params
  const quote = await getQuoteByToken(token)
  if (!quote || quote.status === "draft") notFound()
  const [settings, admin] = await Promise.all([getBillingSettings(), getCurrentUser()])

  // First time the client opens it (the team's own visits don't count).
  if (!quote.viewedAt && !admin) {
    await updateQuote(quote.id, { viewedAt: new Date() })
    const target = quote.clientId ? (["client", quote.clientId] as const) : quote.leadId ? (["lead", quote.leadId] as const) : null
    if (target) await addTimeline(target[0], target[1], { type: "system", text: `Client opened quote ${quote.number}`, by: "Client" })
  }

  const parts = splitTotal(quote.total, quote.schedule)
  const status = quote.expired ? "expired" : quote.status

  return (
    <main className="min-h-screen bg-neutral px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-charcoal/80">
            Status: <span className="font-semibold text-forest">{quoteStatusLabels[status]}</span>
            {quote.status === "accepted" && quote.decidedBy && ` by ${quote.decidedBy}`}
          </p>
          <a href={`/quote/${token}/pdf`} className="inline-flex items-center gap-2 rounded-lg border border-sage/40 bg-white px-4 py-2 text-sm font-semibold text-forest">
            <Download className="w-4 h-4" aria-hidden />
            Download PDF
          </a>
        </div>

        <DocumentView
          kind="Quote"
          number={quote.number}
          dates={[
            ["Date", longDate(pakistanDate(quote.createdAt))],
            ["Valid until", longDate(quote.validUntil)],
          ]}
          settings={settings}
          billTo={quote.billTo}
          title={quote.title}
          items={quote.items}
          currency={quote.currency}
          discount={quote.discount}
        >
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">How it&apos;s paid</h2>
            <ul className="divide-y divide-sage/20 text-sm">
              {parts.map((part) => (
                <li key={part.label} className="flex justify-between py-2">
                  <span>
                    {part.label} ({part.percent}%)
                  </span>
                  <span className="font-semibold">{money(part.amount, quote.currency)}</span>
                </li>
              ))}
            </ul>
          </section>
          <TextBlock title="Scope and notes" text={quote.notes} />
          <TextBlock title="Terms" text={settings.quoteTerms} bullets />
        </DocumentView>

        {status === "sent" && <QuoteAnswer token={token} total={money(quote.total, quote.currency)} />}
        {/* Shown after answering too: the page refreshes with the new status. */}
        {quote.status === "accepted" && (
          <p role="status" className="rounded-2xl bg-mint/60 p-5 font-semibold text-forest">
            Accepted{quote.decidedBy ? ` by ${quote.decidedBy}` : ""}
            {quote.decidedAt ? ` on ${longDate(pakistanDate(quote.decidedAt))}` : ""}. Thank you! We&apos;ll be in touch shortly with the deposit invoice and next steps.
          </p>
        )}
        {quote.status === "declined" && (
          <p role="status" className="rounded-2xl bg-white border border-sage/30 p-5 text-sm">
            This quote was declined. Thanks for letting us know. If anything changes, just reply to our email.
          </p>
        )}
        {status === "expired" && <p className="rounded-2xl bg-white border border-sage/30 p-5 text-sm">This quote has expired. Reply to our email and we&apos;ll send an updated one.</p>}
      </div>
    </main>
  )
}
