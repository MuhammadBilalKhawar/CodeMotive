"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Loader2 } from "lucide-react"
import { Notice, buttonClass } from "@/components/admin/ui"

type Result = { ok: true; data?: unknown } | { ok: false; error: string }

type Props = {
  label: string
  icon?: React.ReactNode
  // A server action, bound to its arguments with .bind() so it can be passed here.
  run: () => Promise<Result>
  confirm?: string
  // Where to go afterwards. `thenToId` is a path the new id is added to (e.g. "/admin/invoices/").
  then?: string
  thenToId?: string
  done?: string
  variant?: keyof typeof buttonClass
}

// A button that runs a server action, then refreshes or navigates.
export function ActionButton({ label, icon, run, confirm, then, thenToId, done, variant = "secondary" }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const click = () => {
    if (confirm && !window.confirm(confirm)) return
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await run()
      if (!result.ok) return setError(result.error)
      if (done) setMessage(done)
      const id = (result.data as { id?: string } | undefined)?.id
      if (thenToId && id) router.push(`${thenToId}${id}`)
      else if (then) router.push(then)
      else router.refresh()
    })
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <button type="button" onClick={click} disabled={pending} className={buttonClass[variant]}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : icon}
        {label}
      </button>
      {error && (
        <Notice tone="error">
          <span className="whitespace-pre-line">{error}</span>
        </Notice>
      )}
      {message && <Notice tone="success">{message}</Notice>}
    </span>
  )
}

export function CopyLinkButton({ url, label = "Copy client link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={buttonClass.secondary}
      onClick={async () => {
        await navigator.clipboard.writeText(url).catch(() => window.prompt("Copy this link:", url))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  )
}
