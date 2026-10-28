import { track } from "@vercel/analytics"

type Gtag = (...args: unknown[]) => void

// Custom event to Vercel Analytics and GA4 (only if GA is loaded). Never throws.
export function trackEvent(name: string, params: Record<string, string> = {}) {
  try {
    track(name, params)
  } catch {}
  try {
    ;(window as unknown as { gtag?: Gtag }).gtag?.("event", name, params)
  } catch {}
}

// Conversion event when a form is sent: "lead" in Vercel Analytics and GA4's
// recommended "generate_lead" event.
export function trackLead(form: "contact" | "mockup") {
  try {
    track("lead", { form })
  } catch {}
  try {
    ;(window as unknown as { gtag?: Gtag }).gtag?.("event", "generate_lead", { form })
  } catch {}
}
