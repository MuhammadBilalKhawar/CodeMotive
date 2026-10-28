"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie } from "lucide-react"
import { CONSENT_KEY, gaId } from "@/components/analytics/google-analytics"

const OPEN_EVENT = "cm-open-consent"

type Gtag = (...args: unknown[]) => void

function saveChoice(choice: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, choice)
  } catch {}
  ;(window as unknown as { gtag?: Gtag }).gtag?.("consent", "update", { analytics_storage: choice })
}

// Asks once whether Google Analytics may use cookies. Non-blocking: the site
// works the same either way. Only shown when GA is configured.
export function ConsentBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!gaId) return
    let stored: string | null = null
    try {
      stored = localStorage.getItem(CONSENT_KEY)
    } catch {}
    if (!stored) setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, reopen)
    return () => window.removeEventListener(OPEN_EVENT, reopen)
  }, [])

  if (!open) return null

  const choose = (choice: "granted" | "denied") => {
    saveChoice(choice)
    setOpen(false)
  }

  return (
    <section
      aria-label="Cookie choices"
      className="fixed z-[70] bottom-4 left-4 right-20 md:right-auto md:max-w-md bg-forest-800 gradient-border glow-forest rounded-2xl p-5 text-neutral theme-dark animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
    >
      <p className="flex items-start gap-3 text-sm leading-relaxed">
        <Cookie className="w-5 h-5 mt-0.5 shrink-0 text-mint" aria-hidden />
        <span>
          May we use Google Analytics cookies to see how visitors use the site? No ads, no selling data.{" "}
          <Link href="/privacy" className="font-semibold text-mint underline underline-offset-4">
            Privacy policy
          </Link>
        </span>
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => choose("granted")} className="flex-1 rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-forest">
          Accept
        </button>
        <button type="button" onClick={() => choose("denied")} className="flex-1 rounded-xl border border-mint/40 px-4 py-2.5 text-sm font-semibold text-mint">
          Decline
        </button>
      </div>
    </section>
  )
}

// Footer link to change the choice later.
export function CookieSettingsButton({ className }: { className?: string }) {
  if (!gaId) return null
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Cookie settings
    </button>
  )
}
