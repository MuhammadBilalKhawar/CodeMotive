"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { createLeadAction, updateLeadAction } from "@/app/admin/actions/crm"
import { Field, inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"
import { currencies, pakistanDate, sourceLabels, sources, stageLabels, stages, type LeadEdit } from "@/lib/crm/schemas"

type Props = {
  // Missing for a new lead.
  leadId?: string
  initial: LeadEdit
  users: { id: string; name: string }[]
  serviceOptions: string[]
}

// Follow-up shortcuts, in days from today (Pakistan time).
const quickDates = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
]
const addDays = (days: number) => pakistanDate(new Date(Date.now() + days * 86_400_000))

export function LeadForm({ leadId, initial, users, serviceOptions }: Props) {
  const router = useRouter()
  const [lead, setLead] = useState(initial)
  const [amount, setAmount] = useState(initial.value ? String(initial.value.amount) : "")
  const [currency, setCurrency] = useState(initial.value?.currency ?? "PKR")
  const [tags, setTags] = useState(initial.tags.join(", "))
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof LeadEdit>(key: K, value: LeadEdit[K]) => {
    setLead((l) => ({ ...l, [key]: value }))
    setSaved(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...lead,
      value: amount.trim() === "" ? null : { amount: Number(amount.replace(/[, ]/g, "")), currency },
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }
    setError(null)
    startTransition(async () => {
      if (leadId) {
        const result = await updateLeadAction(leadId, payload)
        if (!result.ok) return setError(result.error)
        setSaved(true)
        router.refresh()
      } else {
        const result = await createLeadAction({ ...payload, note })
        if (!result.ok) return setError(result.error)
        router.push(`/admin/leads/${result.data.id}`)
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name">
          <input className={inputClass} value={lead.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="Business">
          <input className={inputClass} value={lead.business} onChange={(e) => set("business", e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={lead.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="WhatsApp / phone" hint="With the country code, e.g. +92 300 1234567">
          <input type="tel" className={inputClass} value={lead.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Service">
          <input className={inputClass} list="service-options" value={lead.service} onChange={(e) => set("service", e.target.value)} />
          <datalist id="service-options">
            {serviceOptions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Source">
          <select className={inputClass} value={lead.source} onChange={(e) => set("source", e.target.value as LeadEdit["source"])}>
            {sources.map((s) => (
              <option key={s} value={s}>
                {sourceLabels[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Stage">
          <select className={inputClass} value={lead.stage} onChange={(e) => set("stage", e.target.value as LeadEdit["stage"])}>
            {stages.map((s) => (
              <option key={s} value={s}>
                {stageLabels[s]}
              </option>
            ))}
          </select>
        </Field>
        {lead.stage === "lost" ? (
          <Field label="Reason lost">
            <input className={inputClass} value={lead.lostReason} onChange={(e) => set("lostReason", e.target.value)} placeholder="e.g. Went with a cheaper option" />
          </Field>
        ) : (
          <div className="hidden sm:block" />
        )}
        <div>
          <span className="block text-sm font-semibold text-forest mb-1.5">Deal value (optional)</span>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="lead-currency">
              Currency
            </label>
            <select id="lead-currency" className={cn(inputClass, "w-24")} value={currency} onChange={(e) => (setCurrency(e.target.value as "PKR" | "USD"), setSaved(false))}>
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="lead-amount">
              Amount
            </label>
            <input id="lead-amount" inputMode="numeric" className={inputClass} value={amount} onChange={(e) => (setAmount(e.target.value), setSaved(false))} placeholder="e.g. 85000" />
          </div>
        </div>
        <Field label="Owner">
          <select className={inputClass} value={lead.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
            <option value="">Nobody yet</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Next follow-up">
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" className={cn(inputClass, "w-44")} value={lead.followUpOn} onChange={(e) => set("followUpOn", e.target.value)} />
              {quickDates.map((q) => (
                <button key={q.label} type="button" className={buttonClass.quiet} onClick={() => set("followUpOn", addDays(q.days))}>
                  {q.label}
                </button>
              ))}
              {lead.followUpOn && (
                <button type="button" className={buttonClass.quiet} onClick={() => set("followUpOn", "")}>
                  Clear
                </button>
              )}
            </div>
          </Field>
        </div>
        <Field label="Tags" hint="Separated by commas, e.g. restaurant, urgent" className="sm:col-span-2">
          <input className={inputClass} value={tags} onChange={(e) => (setTags(e.target.value), setSaved(false))} />
        </Field>
        {!leadId && (
          <Field label="First note (optional)" hint="What they asked for, how they found us…" className="sm:col-span-2">
            <textarea rows={4} className={cn(inputClass, "resize-y")} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        )}
      </div>

      {error && <Notice tone="error"><span className="whitespace-pre-line">{error}</span></Notice>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          {leadId ? "Save lead" : "Add lead"}
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
