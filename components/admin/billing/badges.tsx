import { cn } from "@/lib/utils"
import { invoiceStateLabels, quoteStatusLabels, type InvoiceState, type QuoteStatus } from "@/lib/billing/schemas"

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"

const quoteTones: Record<QuoteStatus | "expired", string> = {
  draft: "bg-neutral text-charcoal/80 border border-sage/30",
  sent: "bg-mint/70 text-forest",
  accepted: "bg-sage-600 text-white",
  declined: "bg-charcoal text-neutral",
  expired: "bg-neutral text-charcoal/70 border border-charcoal/20",
}

export function QuoteBadge({ status, expired }: { status: QuoteStatus; expired?: boolean }) {
  const key = expired ? "expired" : status
  return <span className={cn(base, quoteTones[key])}>{quoteStatusLabels[key]}</span>
}

const invoiceTones: Record<InvoiceState, string> = {
  draft: "bg-neutral text-charcoal/80 border border-sage/30",
  unpaid: "bg-mint/70 text-forest",
  partial: "bg-sage/40 text-forest",
  paid: "bg-sage-600 text-white",
  overdue: "bg-charcoal text-neutral",
  void: "bg-neutral text-charcoal/60 line-through",
}

export function InvoiceBadge({ state }: { state: InvoiceState }) {
  return <span className={cn(base, invoiceTones[state])}>{invoiceStateLabels[state]}</span>
}
