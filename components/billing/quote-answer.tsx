"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { acceptQuoteByClient, declineQuoteByClient } from "@/app/quote/[token]/actions"

const input = "w-full rounded-lg border border-sage/40 bg-white px-3 py-2.5 text-charcoal focus:border-forest focus:outline-none"

// Accept (type your name + tick) or decline the quote.
export function QuoteAnswer({ token, total }: { token: string; total: string }) {
  const [name, setName] = useState("")
  const [agree, setAgree] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<"accepted" | "declined" | null>(null)
  const [pending, startTransition] = useTransition()

  if (done) {
    return (
      <div role="status" className="rounded-2xl bg-mint/60 p-5 text-forest flex gap-3">
        <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden />
        <p className="font-semibold">
          {done === "accepted" ? "Thank you! The quote is accepted. We'll be in touch shortly with the deposit invoice and next steps." : "Thanks for letting us know. If anything changes, just reply to our email."}
        </p>
      </div>
    )
  }

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, outcome: "accepted" | "declined") => {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (result.ok) setDone(outcome)
      else setError(result.error)
    })
  }

  return (
    <div className="rounded-2xl border border-forest/30 bg-white p-5 sm:p-6">
      {!declining ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(() => acceptQuoteByClient(token, { name, agree }), "accepted")
          }}
          className="space-y-4"
        >
          <h2 className="font-heading font-bold text-lg text-forest">Accept this quote ({total})</h2>
          <label className="block">
            <span className="block text-sm font-semibold text-forest mb-1.5">Your full name</span>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-forest" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I accept this quote, its payment schedule and terms.
          </label>
          {error && (
            <p role="alert" className="text-sm font-medium text-charcoal">
              ⚠ {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 font-semibold text-neutral disabled:opacity-60">
              {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Accept quote
            </button>
            <button type="button" onClick={() => setDeclining(true)} className="text-sm font-semibold text-sage-600 underline underline-offset-4">
              Decline instead
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(() => declineQuoteByClient(token, reason), "declined")
          }}
          className="space-y-4"
        >
          <h2 className="font-heading font-bold text-lg text-forest">Decline this quote</h2>
          <label className="block">
            <span className="block text-sm font-semibold text-forest mb-1.5">Anything we should know? (optional)</span>
            <textarea rows={3} className={input} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {error && (
            <p role="alert" className="text-sm font-medium text-charcoal">
              ⚠ {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl border border-charcoal/30 px-5 py-3 font-semibold text-charcoal disabled:opacity-60">
              {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Decline quote
            </button>
            <button type="button" onClick={() => setDeclining(false)} className="text-sm font-semibold text-forest underline underline-offset-4">
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
