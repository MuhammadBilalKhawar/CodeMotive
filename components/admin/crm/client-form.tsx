"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClientAction, deleteClientAction, updateClientAction } from "@/app/admin/actions/crm"
import { Field, inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"
import { currencies, type ClientInput } from "@/lib/crm/schemas"

type Props = { clientId?: string; initial: ClientInput; canDelete?: boolean }

export function ClientForm({ clientId, initial, canDelete }: Props) {
  const router = useRouter()
  const [client, setClient] = useState(initial)
  const [tags, setTags] = useState(initial.tags.join(", "))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof ClientInput>(key: K, value: ClientInput[K]) => {
    setClient((c) => ({ ...c, [key]: value }))
    setSaved(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...client, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }
    setError(null)
    startTransition(async () => {
      if (clientId) {
        const result = await updateClientAction(clientId, payload)
        if (!result.ok) return setError(result.error)
        setSaved(true)
        router.refresh()
      } else {
        const result = await createClientAction(payload)
        if (!result.ok) return setError(result.error)
        router.push(`/admin/clients/${result.data.id}`)
      }
    })
  }

  const remove = () => {
    if (!clientId || !window.confirm(`Delete ${client.business || client.name}? Their leads are kept, but the link and the client's timeline are removed.`)) return
    startTransition(async () => {
      const result = await deleteClientAction(clientId)
      if (!result.ok) return setError(result.error)
      router.push("/admin/clients")
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Business">
          <input className={inputClass} value={client.business} onChange={(e) => set("business", e.target.value)} />
        </Field>
        <Field label="Contact person">
          <input className={inputClass} value={client.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={client.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="WhatsApp / phone">
          <input type="tel" className={inputClass} value={client.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Country">
          <input className={inputClass} value={client.country} onChange={(e) => set("country", e.target.value)} />
        </Field>
        <Field label="Billing currency" hint="Used for their quotes and invoices.">
          <select className={inputClass} value={client.currency} onChange={(e) => set("currency", e.target.value as ClientInput["currency"])}>
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Billing address (optional)" hint="Shown on invoices." className="sm:col-span-2">
          <textarea rows={2} className={cn(inputClass, "resize-y")} value={client.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={client.status} onChange={(e) => set("status", e.target.value as ClientInput["status"])}>
            <option value="active">Active</option>
            <option value="past">Past client</option>
          </select>
        </Field>
        <Field label="Tags" hint="Separated by commas.">
          <input className={inputClass} value={tags} onChange={(e) => (setTags(e.target.value), setSaved(false))} />
        </Field>
        <Field label="Notes" hint="Logins, preferences, anything worth remembering." className="sm:col-span-2">
          <textarea rows={4} className={cn(inputClass, "resize-y")} value={client.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>

      {error && <Notice tone="error"><span className="whitespace-pre-line">{error}</span></Notice>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          {clientId ? "Save client" : "Add client"}
        </button>
        {saved && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600">
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            Saved
          </span>
        )}
        {clientId && canDelete && (
          <button type="button" onClick={remove} disabled={pending} className={cn(buttonClass.danger, "ml-auto")}>
            <Trash2 className="w-4 h-4" aria-hidden />
            Delete client
          </button>
        )}
      </div>
    </form>
  )
}
