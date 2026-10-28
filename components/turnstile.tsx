"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

let scriptLoader: Promise<void> | null = null
function loadTurnstile() {
  scriptLoader ??= new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoader = null
      reject(new Error("Turnstile failed to load"))
    }
    document.head.appendChild(script)
  })
  return scriptLoader
}

// State for one form's Turnstile check. The widget (and Cloudflare's script)
// only loads once the visitor starts using the form, so it doesn't slow down
// the page; waitForToken() covers someone pressing Send very quickly.
export function useTurnstile() {
  const [active, setActive] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const token = useRef("")

  const activate = useCallback(() => setActive(true), [])
  const onToken = useCallback((value: string) => {
    token.current = value
  }, [])
  const reset = useCallback(() => {
    token.current = ""
    setResetKey((n) => n + 1)
  }, [])

  const waitForToken = useCallback(async (timeoutMs = 8000) => {
    if (!turnstileSiteKey) return ""
    setActive(true)
    const started = Date.now()
    while (!token.current && Date.now() - started < timeoutMs) {
      await new Promise((r) => setTimeout(r, 200))
    }
    return token.current
  }, [])

  // Spread onto the <form>: the first focus or touch loads the check.
  const formProps = { onFocusCapture: activate, onPointerDownCapture: activate }

  return { active, resetKey, onToken, reset, waitForToken, formProps }
}

type TurnstileProps = {
  active: boolean
  onToken: (token: string) => void
  theme?: "light" | "dark"
  // Change this value to get a fresh widget (e.g. after a failed submit).
  resetKey?: number
}

// Cloudflare Turnstile spam check. Renders nothing unless the site key is set.
export function Turnstile({ active, onToken, theme = "light", resetKey = 0 }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null)
  const callback = useRef(onToken)
  callback.current = onToken

  useEffect(() => {
    if (!turnstileSiteKey || !active) return
    let widgetId: string | undefined
    let cancelled = false
    loadTurnstile()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return
        widgetId = window.turnstile.render(container.current, {
          sitekey: turnstileSiteKey,
          theme,
          callback: (token: string) => callback.current(token),
          "expired-callback": () => callback.current(""),
          "error-callback": () => callback.current(""),
        })
      })
      .catch((error) => console.error(error))
    return () => {
      cancelled = true
      callback.current("")
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [active, theme, resetKey])

  if (!turnstileSiteKey) return null
  // Reserve the widget's height so nothing jumps when it appears.
  return <div ref={container} className="min-h-[65px]" />
}
