"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightLeft, Info, Loader2, Mail, MessageCircle, NotebookPen, Phone, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { addClientNoteAction, addLeadNoteAction } from "@/app/admin/actions/crm"
import { addProjectNoteAction } from "@/app/admin/actions/delivery"
import { inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"
import { noteTypeLabels, noteTypes, type NoteType } from "@/lib/crm/schemas"

export type TimelineItem = { id: string; type: NoteType | "stage" | "system"; text: string; by: string; at: string }

const icons = {
  note: NotebookPen,
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: Users,
  stage: ArrowRightLeft,
  system: Info,
}

// Log a note/call/message and see everything that happened, newest first.
const noteActions = { lead: addLeadNoteAction, client: addClientNoteAction, project: addProjectNoteAction }

export function Timeline({ subject, subjectId, items }: { subject: "lead" | "client" | "project"; subjectId: string; items: TimelineItem[] }) {
  const router = useRouter()
  const [type, setType] = useState<NoteType>("note")
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await noteActions[subject](subjectId, { type, text })
      if (!result.ok) return setError(result.error)
      setText("")
      router.refresh()
    })
  }

  return (
    <div>
      <form onSubmit={add} className="space-y-2.5">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="What happened">
          {noteTypes.map((t) => {
            const Icon = icons[t]
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => setType(t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                  type === t ? "border-forest bg-forest text-neutral" : "border-sage/40 bg-white text-forest hover:border-forest",
                )}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                {noteTypeLabels[t]}
              </button>
            )
          })}
        </div>
        <label className="sr-only" htmlFor={`note-${subjectId}`}>
          Note
        </label>
        <textarea
          id={`note-${subjectId}`}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={type === "note" ? "Add a note…" : `What happened on the ${noteTypeLabels[type].toLowerCase()}?`}
          className={cn(inputClass, "resize-y")}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" disabled={pending || !text.trim()} className={buttonClass.primary}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
          Add to timeline
        </button>
      </form>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-charcoal/70">Nothing logged yet.</p>
      ) : (
        <ol className="mt-6 space-y-4">
          {items.map((item) => {
            const Icon = icons[item.type]
            const automatic = item.type === "stage" || item.type === "system"
            return (
              <li key={item.id} className="flex gap-3">
                <span className={cn("mt-0.5 w-8 h-8 shrink-0 rounded-full flex items-center justify-center", automatic ? "bg-neutral text-charcoal/60" : "bg-mint/60 text-forest")}>
                  <Icon className="w-4 h-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-charcoal/65">
                    {automatic ? "" : `${noteTypeLabels[item.type as NoteType]} · `}
                    {item.by} · {item.at}
                  </p>
                  <p className={cn("text-sm whitespace-pre-wrap break-words", automatic ? "text-charcoal/75" : "text-charcoal")}>{item.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
