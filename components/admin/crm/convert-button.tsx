"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserRoundCheck } from "lucide-react"
import { convertLeadAction } from "@/app/admin/actions/crm"
import { Notice, buttonClass } from "@/components/admin/ui"

// Marks the lead won and opens its client (new, or the existing one with the same email).
export function ConvertButton({ leadId, name }: { leadId: string; name: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const convert = () => {
    if (!window.confirm(`Mark ${name} as won and make them a client?`)) return
    startTransition(async () => {
      const result = await convertLeadAction(leadId)
      if (!result.ok) return setError(result.error)
      router.push(`/admin/clients/${result.data.clientId}`)
    })
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={convert} disabled={pending} className={buttonClass.primary}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <UserRoundCheck className="w-4 h-4" aria-hidden />}
        Won: make client
      </button>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}
