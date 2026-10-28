"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { createProjectAction, updateProjectAction } from "@/app/admin/actions/delivery"
import { Field, inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"
import { projectKindLabels, projectKinds, projectStageLabels, projectStages, type ProjectInput } from "@/lib/delivery/schemas"

type Option = { id: string; name: string }

const linkFields: [keyof ProjectInput["links"], string, string][] = [
  ["live", "Live site", "https://"],
  ["staging", "Staging / preview", "https://"],
  ["jira", "Jira board or issue", "https://…atlassian.net/…"],
  ["repo", "Code repository", "https://github.com/…"],
  ["design", "Design (Figma…)", "https://"],
]

export function ProjectForm({ projectId, initial, clients, users }: { projectId?: string; initial: ProjectInput; clients: Option[]; users: Option[] }) {
  const router = useRouter()
  const [p, setP] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => {
    setP((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      if (projectId) {
        const result = await updateProjectAction(projectId, p)
        if (!result.ok) return setError(result.error)
        setSaved(true)
        router.refresh()
      } else {
        const result = await createProjectAction(p)
        if (!result.ok) return setError(result.error)
        router.push(`/admin/projects/${result.data.id}`)
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Project name" className="sm:col-span-2">
          <input className={inputClass} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Khan Bakers website" />
        </Field>
        <Field label="Client">
          <select className={inputClass} value={p.clientId} onChange={(e) => set("clientId", e.target.value)} disabled={Boolean(projectId)}>
            <option value="">Choose a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" hint={projectId ? undefined : "Sets the starting checklist."}>
          <select className={inputClass} value={p.kind} onChange={(e) => set("kind", e.target.value as ProjectInput["kind"])}>
            {projectKinds.map((k) => (
              <option key={k} value={k}>
                {projectKindLabels[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stage">
          <select className={inputClass} value={p.stage} onChange={(e) => set("stage", e.target.value as ProjectInput["stage"])}>
            {projectStages.map((s) => (
              <option key={s} value={s}>
                {projectStageLabels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Owner">
          <select className={inputClass} value={p.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
            <option value="">Nobody yet</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date">
          <input type="date" className={cn(inputClass, "w-44")} value={p.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="Deadline">
          <input type="date" className={cn(inputClass, "w-44")} value={p.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </Field>
      </div>

      <fieldset className="rounded-xl border border-sage/25 p-4">
        <legend className="px-1 text-sm font-semibold text-forest">Links</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {linkFields.map(([key, label, placeholder]) => (
            <Field key={key} label={label}>
              <input className={inputClass} value={p.links[key]} placeholder={placeholder} onChange={(e) => set("links", { ...p.links, [key]: e.target.value })} />
            </Field>
          ))}
        </div>
      </fieldset>

      <Field label="Notes" hint="Scope, decisions, anything the team should know.">
        <textarea rows={4} className={cn(inputClass, "resize-y")} value={p.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <Field label="Handover notes" hint="Printed in the handover pack: how to update the site, where things are, support. Never write passwords here.">
        <textarea rows={4} className={cn(inputClass, "resize-y")} value={p.handoverNotes} onChange={(e) => set("handoverNotes", e.target.value)} />
      </Field>

      {error && (
        <Notice tone="error">
          <span className="whitespace-pre-line">{error}</span>
        </Notice>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          {projectId ? "Save project" : "Create project"}
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
