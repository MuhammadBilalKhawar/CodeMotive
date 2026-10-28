"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { createCarePlanAction, updateCarePlanAction } from "@/app/admin/actions/delivery"
import { Field, inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"
import { money } from "@/lib/billing/schemas"
import type { CarePlanInput } from "@/lib/delivery/schemas"

type Option = { id: string; name: string; currency?: "PKR" | "USD" }
export type CarePackage = { id: string; name: string; features: string[]; priceFrom: { PKR: number | null; USD: number | null } }

export function CarePlanForm({ planId, initial, clients, projects, packages }: { planId?: string; initial: CarePlanInput; clients: Option[]; projects: (Option & { clientId: string })[]; packages: CarePackage[] }) {
  const router = useRouter()
  const [plan, setPlan] = useState(initial)
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : "")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof CarePlanInput>(key: K, value: CarePlanInput[K]) => {
    setPlan((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  // Fill name, description and price from a care plan package in Pricing.
  const usePackage = (id: string) => {
    const pkg = packages.find((p) => p.id === id)
    if (!pkg) return
    setPlan((p) => ({ ...p, name: pkg.name, description: pkg.features.join(" · ").slice(0, 600) }))
    const price = pkg.priceFrom[plan.currency]
    if (price !== null) setAmount(String(price))
    setSaved(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const payload = { ...plan, amount: amount.trim() === "" ? Number.NaN : Number(amount.replace(/[, ]/g, "")) }
    startTransition(async () => {
      if (planId) {
        const result = await updateCarePlanAction(planId, payload)
        if (!result.ok) return setError(result.error)
        setSaved(true)
        router.refresh()
      } else {
        const result = await createCarePlanAction(payload)
        if (!result.ok) return setError(result.error)
        router.push(`/admin/care-plans/${result.data.id}`)
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client">
          <select
            className={inputClass}
            value={plan.clientId}
            disabled={Boolean(planId)}
            onChange={(e) => {
              const client = clients.find((c) => c.id === e.target.value)
              setPlan((p) => ({ ...p, clientId: e.target.value, projectId: "", currency: client?.currency ?? p.currency }))
            }}
          >
            <option value="">Choose a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Project (optional)">
          <select className={inputClass} value={plan.projectId} onChange={(e) => set("projectId", e.target.value)}>
            <option value="">Not linked</option>
            {projects
              .filter((p) => p.clientId === plan.clientId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </Field>
        {!planId && packages.length > 0 && (
          <Field label="Start from a package" hint="Fills the name, what's included and the price." className="sm:col-span-2">
            <select className={inputClass} value="" onChange={(e) => usePackage(e.target.value)}>
              <option value="">Choose…</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.priceFrom[plan.currency] !== null ? `(${money(p.priceFrom[plan.currency]!, plan.currency)} a month)` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Plan name">
          <input className={inputClass} value={plan.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Care Plan Plus" />
        </Field>
        <Field label="Price">
          <div className="flex gap-2">
            <select aria-label="Currency" className={cn(inputClass, "w-24")} value={plan.currency} onChange={(e) => set("currency", e.target.value as "PKR" | "USD")}>
              <option>PKR</option>
              <option>USD</option>
            </select>
            <input inputMode="numeric" className={inputClass} value={amount} onChange={(e) => (setAmount(e.target.value), setSaved(false))} />
            <select aria-label="Billed" className={cn(inputClass, "w-32")} value={plan.interval} onChange={(e) => set("interval", e.target.value as "monthly" | "yearly")}>
              <option value="monthly">a month</option>
              <option value="yearly">a year</option>
            </select>
          </div>
        </Field>
        <Field label="What's included (on each invoice)" className="sm:col-span-2">
          <textarea rows={3} className={cn(inputClass, "resize-y")} value={plan.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Next invoice on" hint="The daily job creates the invoice on this date, then moves it on a month (or year).">
          <input type="date" className={cn(inputClass, "w-44")} value={plan.nextInvoiceOn} onChange={(e) => set("nextInvoiceOn", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={plan.status} onChange={(e) => set("status", e.target.value as CarePlanInput["status"])}>
            <option value="active">Active</option>
            <option value="paused">Paused (no invoices)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="When an invoice is created" className="sm:col-span-2">
          <select className={inputClass} value={plan.invoiceMode} onChange={(e) => set("invoiceMode", e.target.value as CarePlanInput["invoiceMode"])}>
            <option value="draft">Keep it as a draft for me to check and send</option>
            <option value="send">Email it to the client straight away</option>
          </select>
        </Field>
      </div>
      {error && (
        <Notice tone="error">
          <span className="whitespace-pre-line">{error}</span>
        </Notice>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          {planId ? "Save care plan" : "Add care plan"}
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
