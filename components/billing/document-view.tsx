import Image from "next/image"
import { lineTotal, longDate, money, paymentMethodLabels, subtotal, type BillTo, type LineItem } from "@/lib/billing/schemas"
import type { BillingSettings } from "@/lib/billing/schemas"
import type { Payment } from "@/lib/billing/store"

// The quote or invoice as a web page (the client's link). Mirrors the PDF.

const lines = (text: string) => text.split("\n").filter((line) => line.trim())

type Props = {
  kind: "Quote" | "Invoice"
  number: string
  dates: [string, string][]
  settings: BillingSettings
  billTo: BillTo
  title?: string
  items: LineItem[]
  currency: "PKR" | "USD"
  discount: number
  // Extra rows under the total (paid, balance due).
  totals?: [string, string][]
  children?: React.ReactNode
}

export function DocumentView({ kind, number, dates, settings, billTo, title, items, currency, discount, totals = [], children }: Props) {
  const sub = subtotal(items)
  return (
    <article className="rounded-3xl bg-white border border-sage/25 shadow-lift p-6 sm:p-10">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b-2 border-forest">
        <Image src="/brand/header-logo-light-mode.svg" alt={settings.businessName} width={180} height={40} className="h-9 w-auto" />
        <div className="sm:text-right">
          <p className="font-heading font-bold text-2xl text-forest uppercase tracking-wide">{kind}</p>
          <p className="font-semibold text-forest">{number}</p>
          {dates.map(([label, value]) => (
            <p key={label} className="text-sm text-sage-600">
              {label}: {value}
            </p>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-1">From</p>
          <p className="font-semibold">{settings.businessName}</p>
          {lines(settings.details).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-1">For</p>
          <p className="font-semibold">{billTo.business || billTo.name}</p>
          {billTo.business && <p>{billTo.name}</p>}
          {lines(billTo.address).map((line) => (
            <p key={line}>{line}</p>
          ))}
          {billTo.email && <p className="break-all">{billTo.email}</p>}
        </div>
      </div>

      {title && <h1 className="font-heading font-bold text-xl text-forest mt-8">{title}</h1>}

      {/* Phones: one block per line, so no column is cut off. */}
      <ul className="mt-5 sm:hidden divide-y divide-sage/20 border-y border-sage/20 text-sm">
        {items.map((item, i) => (
          <li key={i} className="py-3">
            <div className="flex justify-between gap-3">
              <p className="font-semibold">{item.description}</p>
              <p className="font-semibold whitespace-nowrap">{money(lineTotal(item), currency)}</p>
            </div>
            {item.quantity > 1 && (
              <p className="text-xs text-charcoal/75 mt-0.5">
                {item.quantity} × {money(item.unitPrice, currency)}
              </p>
            )}
            {item.details && <p className="text-xs text-sage-600 mt-1 whitespace-pre-line">{item.details}</p>}
          </li>
        ))}
      </ul>

      <div className="mt-5 hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-forest text-white text-left">
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 font-semibold text-right w-14">Qty</th>
              <th className="px-3 py-2 font-semibold text-right w-28">Price</th>
              <th className="px-3 py-2 font-semibold text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-sage/20 align-top">
                <td className="px-3 py-3">
                  <p className="font-semibold">{item.description}</p>
                  {item.details && <p className="text-xs text-sage-600 mt-0.5 whitespace-pre-line">{item.details}</p>}
                </td>
                <td className="px-3 py-3 text-right">{item.quantity}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap">{money(item.unitPrice, currency)}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap">{money(lineTotal(item), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-4 ml-auto w-full sm:w-72 text-sm">
        {discount > 0 && (
          <>
            <div className="flex justify-between py-1">
              <dt>Subtotal</dt>
              <dd>{money(sub, currency)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt>Discount</dt>
              <dd>-{money(discount, currency)}</dd>
            </div>
          </>
        )}
        <div className="flex justify-between mt-1 px-3 py-2 bg-mint/60 rounded-lg font-bold text-forest text-base">
          <dt>Total ({currency})</dt>
          <dd>{money(Math.max(0, sub - discount), currency)}</dd>
        </div>
        {totals.map(([label, value]) => (
          <div key={label} className="flex justify-between px-3 py-1.5 font-semibold">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {children}
    </article>
  )
}

export function PaymentsList({ payments, currency }: { payments: Payment[]; currency: "PKR" | "USD" }) {
  if (payments.length === 0) return null
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">Payments received</h2>
      <ul className="divide-y divide-sage/20 text-sm">
        {payments.map((p) => (
          <li key={p.id} className="flex justify-between py-2 gap-4">
            <span>
              {longDate(p.date)} · {paymentMethodLabels[p.method]}
              {p.reference ? ` · ${p.reference}` : ""}
            </span>
            <span className="font-semibold">{money(p.amount, currency)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TextBlock({ title, text, bullets }: { title: string; text: string; bullets?: boolean }) {
  if (!text.trim()) return null
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">{title}</h2>
      {bullets ? (
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {lines(text).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      ) : (
        <div className="space-y-1 text-sm">
          {lines(text).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </section>
  )
}
