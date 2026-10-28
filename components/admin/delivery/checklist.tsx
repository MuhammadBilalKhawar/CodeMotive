"use client"

import { useOptimistic, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { addChecklistItemAction, removeChecklistItemAction, toggleChecklistAction } from "@/app/admin/actions/delivery"
import { inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"

export type ChecklistRow = { id: string; text: string; done: boolean; doneBy?: string; doneAt?: string }

// Tick tasks off; each tick is saved straight away.
export function Checklist({ projectId, items }: { projectId: string; items: ChecklistRow[] }) {
  const router = useRouter()
  const [optimistic, setOptimistic] = useOptimistic(items, (list, { id, done }: { id: string; done: boolean }) => list.map((i) => (i.id === id ? { ...i, done } : i)))
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const done = optimistic.filter((i) => i.done).length
  const percent = optimistic.length ? Math.round((done / optimistic.length) * 100) : 0

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    startTransition(async () => {
      setError(null)
      const result = await fn()
      if (!result.ok) setError(result.error ?? "Something went wrong.")
      else after?.()
      router.refresh()
    })

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 rounded-full bg-neutral overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Checklist progress">
          <div className="h-full bg-sage-600 transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-sm font-semibold text-forest whitespace-nowrap">
          {done}/{optimistic.length} done
        </span>
      </div>
      <ul className="divide-y divide-sage/15">
        {optimistic.map((item) => (
          <li key={item.id} className="py-2 flex items-start gap-3 group">
            <input
              type="checkbox"
              id={`task-${item.id}`}
              className="mt-1 w-4 h-4 accent-forest shrink-0"
              checked={item.done}
              onChange={(e) => {
                const value = e.target.checked
                run(async () => {
                  setOptimistic({ id: item.id, done: value })
                  return toggleChecklistAction(projectId, item.id, value)
                })
              }}
            />
            <label htmlFor={`task-${item.id}`} className={cn("flex-1 text-sm cursor-pointer", item.done && "text-charcoal/55 line-through")}>
              {item.text}
              {item.done && item.doneBy && <span className="block text-xs text-charcoal/50 no-underline">{item.doneBy}{item.doneAt ? ` · ${item.doneAt}` : ""}</span>}
            </label>
            <button
              type="button"
              aria-label={`Remove "${item.text}"`}
              className="opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 text-charcoal/60 hover:text-charcoal"
              onClick={() => window.confirm(`Remove "${item.text}"?`) && run(() => removeChecklistItemAction(projectId, item.id))}
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) run(() => addChecklistItemAction(projectId, { text }), () => setText(""))
        }}
      >
        <label className="flex-1">
          <span className="sr-only">New task</span>
          <input className={inputClass} placeholder="Add a task…" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button type="submit" disabled={pending || !text.trim()} className={buttonClass.secondary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
          Add
        </button>
      </form>
      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </div>
  )
}
