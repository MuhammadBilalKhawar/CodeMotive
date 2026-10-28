"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveBillingSettingsAction } from "@/app/admin/actions/billing"
import { Field, inputClass } from "@/components/admin/fields"
import { Card, Notice, buttonClass } from "@/components/admin/ui"
import type { BillingSettings } from "@/lib/billing/schemas"

export function BillingSettingsForm({ initial }: { initial: BillingSettings }) {
  const router = useRouter()
  const [s, setS] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof BillingSettings>(key: K, value: BillingSettings[K]) => {
    setS((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }
  const num = (text: string) => (text.trim() === "" ? Number.NaN : Number(text))
  const percentSum = s.defaultSchedule.reduce((sum, p) => sum + (Number.isFinite(p.percent) ? p.percent : 0), 0)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await saveBillingSettingsAction(s)
      if (!result.ok) return setError(result.error)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <Card title="On every quote and invoice">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business name">
            <input className={inputClass} value={s.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </Field>
          <Field label="Details under the name" hint="Address, email, phone, website. One per line.">
            <textarea rows={4} className={cn(inputClass, "resize-y")} value={s.details} onChange={(e) => set("details", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="How clients pay" description="Shown on unpaid invoices. There's no online card payment; you record payments yourself.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Pakistan (PKR invoices)" hint="Bank name, account title, account number / IBAN, JazzCash or Easypaisa number.">
            <textarea rows={6} className={cn(inputClass, "resize-y")} value={s.pkrInstructions} onChange={(e) => set("pkrInstructions", e.target.value)} placeholder={"Bank: …\nAccount title: …\nIBAN: PK…"} />
          </Field>
          <Field label="International (USD invoices)" hint="Payoneer email, Wise details, or how to ask for them.">
            <textarea rows={6} className={cn(inputClass, "resize-y")} value={s.usdInstructions} onChange={(e) => set("usdInstructions", e.target.value)} placeholder={"Payoneer: …\nWise: …"} />
          </Field>
        </div>
        {(!s.pkrInstructions.trim() || !s.usdInstructions.trim()) && <p className="mt-3 text-sm text-charcoal/80">⚠ Without these, invoices don&apos;t say how to pay.</p>}
      </Card>

      <Card title="Quotes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Quotes are valid for (days)">
            <input inputMode="numeric" className={cn(inputClass, "w-28")} value={Number.isFinite(s.quoteValidDays) ? s.quoteValidDays : ""} onChange={(e) => set("quoteValidDays", num(e.target.value))} />
          </Field>
        </div>
        <div className="mt-5">
          <span className="block text-sm font-semibold text-forest mb-1.5">Default payment split for new quotes</span>
          <ul className="space-y-2">
            {s.defaultSchedule.map((part, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <label className="flex-1 min-w-[160px]">
                  <span className="sr-only">Payment {i + 1} name</span>
                  <input className={inputClass} value={part.label} onChange={(e) => set("defaultSchedule", s.defaultSchedule.map((p, j) => (j === i ? { ...p, label: e.target.value } : p)))} />
                </label>
                <label className="flex items-center gap-1">
                  <span className="sr-only">Percent</span>
                  <input inputMode="numeric" className={cn(inputClass, "w-20 text-right")} value={Number.isFinite(part.percent) ? part.percent : ""} onChange={(e) => set("defaultSchedule", s.defaultSchedule.map((p, j) => (j === i ? { ...p, percent: num(e.target.value) } : p)))} />
                  <span className="text-sm">%</span>
                </label>
                <button type="button" className={buttonClass.quiet} aria-label="Remove payment" disabled={s.defaultSchedule.length === 1} onClick={() => set("defaultSchedule", s.defaultSchedule.filter((_, j) => j !== i))}>
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-3">
            {s.defaultSchedule.length < 4 && (
              <button type="button" className={buttonClass.quiet} onClick={() => set("defaultSchedule", [...s.defaultSchedule, { label: "Milestone", percent: 0 }])}>
                <Plus className="w-4 h-4" aria-hidden />
                Add payment
              </button>
            )}
            <span className={cn("text-sm font-semibold", percentSum === 100 ? "text-sage-600" : "text-red-700")}>{percentSum}% of 100%</span>
          </div>
        </div>
        <Field label="Terms printed on every quote" hint="One per line." className="mt-5">
          <textarea rows={6} className={cn(inputClass, "resize-y")} value={s.quoteTerms} onChange={(e) => set("quoteTerms", e.target.value)} />
        </Field>
      </Card>

      <Card title="Invoices">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Payment due after (days)" hint="0 means due on receipt.">
            <input inputMode="numeric" className={cn(inputClass, "w-28")} value={Number.isFinite(s.invoiceDueDays) ? s.invoiceDueDays : ""} onChange={(e) => set("invoiceDueDays", num(e.target.value))} />
          </Field>
          <Field label="Footer line">
            <input className={inputClass} value={s.invoiceFooter} onChange={(e) => set("invoiceFooter", e.target.value)} />
          </Field>
        </div>
        <label className="mt-5 flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-forest" checked={s.autoReminders} onChange={(e) => set("autoReminders", e.target.checked)} />
          <span>
            <span className="block text-sm font-semibold text-forest">Email clients a reminder when an invoice is overdue</span>
            <span className="block text-xs text-charcoal/70 mt-0.5">3 and 10 days after the due date, with the invoice attached. Overdue invoices are in your morning digest either way.</span>
          </span>
        </label>
      </Card>

      {error && (
        <Notice tone="error">
          <span className="whitespace-pre-line">{error}</span>
        </Notice>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          Save billing settings
        </button>
        {saved && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600">
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            Saved
          </span>
        )}
      </div>
    </form>
  )
}
