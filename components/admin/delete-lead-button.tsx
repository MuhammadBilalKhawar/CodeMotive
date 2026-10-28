"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { deleteLeadAction } from "@/app/admin/actions/leads"

// `redirectTo`: where to go afterwards (the lead's own page no longer exists).
export function DeleteLeadButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const remove = () => {
    if (!window.confirm(`Delete the enquiry from ${name}? This can't be undone.`)) return
    startTransition(async () => {
      const result = await deleteLeadAction(id)
      if (!result.ok) setError(result.error)
      else if (redirectTo) router.push(redirectTo)
    })
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-sage/40 px-3 py-1.5 text-sm font-semibold text-charcoal hover:bg-neutral disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Trash2 className="w-4 h-4" aria-hidden />}
        Delete
      </button>
      {error && (
        <span role="alert" className="text-sm text-charcoal">
          ⚠ {error}
        </span>
      )}
    </span>
  )
}
