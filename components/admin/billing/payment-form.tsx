"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { recordPaymentAction } from "@/app/admin/actions/billing"
import { Field, inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"
import { paymentMethodLabels, paymentMethods, type PaymentMethod } from "@/lib/billing/schemas"

// Record money received (bank transfer, Payoneer, ...). There's no online card payment.
export function PaymentForm({ invoiceId, balance, currency, today }: { invoiceId: string; balance: number; currency: "PKR" | "USD"; today: string }) {
  const router = useRouter()
  const [date, setDate] = useState(today)
  const [amount, setAmount] = useState(String(balance))
  const [method, setMethod] = useState<PaymentMethod>(currency === "PKR" ? "bank" : "payoneer")
  const [reference, setReference] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await recordPaymentAction(invoiceId, { date, amount: amount.trim() === "" ? Number.NaN : Number(amount.replace(/[, ]/g, "")), method, reference })
      if (!result.ok) return setError(result.error)
      setReference("")
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={`Amount (${currency})`}>
          <input inputMode="numeric" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Date received">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Method">
          <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {paymentMethodLabels[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reference (optional)" hint="Transaction ID or note">
          <input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <button type="submit" disabled={pending} className={cn(buttonClass.primary)}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
        Record payment
      </button>
    </form>
  )
}
