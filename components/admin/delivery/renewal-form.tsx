"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { createRenewalAction, updateRenewalAction } from "@/app/admin/actions/delivery"
import { Field, inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"
import { renewalKindLabels, renewalKinds, type RenewalInput } from "@/lib/delivery/schemas"

type Option = { id: string; name: string }

export function RenewalForm({ renewalId, initial, clients, projects }: { renewalId?: string; initial: RenewalInput; clients: Option[]; projects: (Option & { clientId: string })[] }) {
  const router = useRouter()
  const [r, setR] = useState(initial)
  const [cost, setCost] = useState(initial.cost === null ? "" : String(initial.cost))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof RenewalInput>(key: K, value: RenewalInput[K]) => {
    setR((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const payload = { ...r, cost: cost.trim() === "" ? null : Number(cost.replace(/[, ]/g, "")) }
    startTransition(async () => {
      if (renewalId) {
        const result = await updateRenewalAction(renewalId, payload)
        if (!result.ok) return setError(result.error)
        setSaved(true)
        router.refresh()
      } else {
        const result = await createRenewalAction(payload)
        if (!result.ok) return setError(result.error)
        setR({ ...initial, clientId: r.clientId, projectId: r.projectId })
        setCost("")
        setSaved(true)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="What renews" hint="e.g. khanbakers.com, or the hosting plan name">
          <input className={inputClass} value={r.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Type">
          <select className={inputClass} value={r.kind} onChange={(e) => set("kind", e.target.value as RenewalInput["kind"])}>
            {renewalKinds.map((k) => (
              <option key={k} value={k}>
                {renewalKindLabels[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Renews on">
          <input type="date" className={inputClass} value={r.renewsOn} onChange={(e) => set("renewsOn", e.target.value)} />
        </Field>
        <Field label="Client">
          <select className={inputClass} value={r.clientId} onChange={(e) => setR((cur) => ({ ...cur, clientId: e.target.value, projectId: "" }))}>
            <option value="">Ours (not a client's)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Project (optional)">
          <select className={inputClass} value={r.projectId} onChange={(e) => set("projectId", e.target.value)}>
            <option value="">Not linked</option>
            {projects
              .filter((p) => p.clientId === r.clientId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Provider">
          <input className={inputClass} value={r.provider} onChange={(e) => set("provider", e.target.value)} placeholder="e.g. Namecheap, Hostinger" />
        </Field>
        <Field label="Cost (optional)">
          <div className="flex gap-2">
            <select aria-label="Currency" className={cn(inputClass, "w-24")} value={r.currency} onChange={(e) => set("currency", e.target.value as "PKR" | "USD")}>
              <option>PKR</option>
              <option>USD</option>
            </select>
            <input inputMode="numeric" className={inputClass} value={cost} onChange={(e) => (setCost(e.target.value), setSaved(false))} />
          </div>
        </Field>
        <Field label="Who pays the provider">
          <select className={inputClass} value={r.paidBy} onChange={(e) => set("paidBy", e.target.value as RenewalInput["paidBy"])}>
            <option value="client">The client, directly</option>
            <option value="us">We pay, then bill the client</option>
          </select>
        </Field>
        <label className="flex items-center gap-2.5 text-sm font-semibold text-forest self-end pb-2.5">
          <input type="checkbox" className="w-4 h-4 accent-forest" checked={r.autoRenew} onChange={(e) => set("autoRenew", e.target.checked)} />
          Renews automatically
        </label>
      </div>
      <Field label="Notes">
        <input className={inputClass} value={r.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Card on file is the client's" />
      </Field>
      {error && (
        <Notice tone="error">
          <span className="whitespace-pre-line">{error}</span>
        </Notice>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          {renewalId ? "Save renewal" : "Add renewal"}
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
