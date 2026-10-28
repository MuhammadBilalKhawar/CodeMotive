"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ThumbsDown } from "lucide-react"
import { decideQuoteAction } from "@/app/admin/actions/billing"
import { Notice, buttonClass } from "@/components/admin/ui"

// The client said no outside the link: record it with an optional reason.
export function DeclineQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  return (
    <span className="inline-flex flex-col gap-2">
      <button
        type="button"
        className={buttonClass.secondary}
        disabled={pending}
        onClick={() => {
          const reason = window.prompt("Mark as declined. Why? (optional)", "")
          if (reason === null) return
          startTransition(async () => {
            const result = await decideQuoteAction(quoteId, "declined", reason)
            if (!result.ok) setError(result.error)
            else router.refresh()
          })
        }}
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <ThumbsDown className="w-4 h-4" aria-hidden />}
        Mark declined
      </button>
      {error && <Notice tone="error">{error}</Notice>}
    </span>
  )
}
