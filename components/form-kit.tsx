import Link from "next/link"
import { AlertCircle, Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSiteContact } from "@/components/site-contact"

// Pieces shared by the contact and free-mockup forms.

export type FormTone = "light" | "dark"

export function formStyles(tone: FormTone) {
  const dark = tone === "dark"
  return {
    dark,
    panel: dark ? "glass gradient-border text-neutral" : "gradient-border gradient-border-light bg-white text-charcoal shadow-lift",
    label: cn("block text-sm font-semibold mb-2", dark ? "text-mint" : "text-forest"),
    hint: cn("block text-xs mt-1.5", dark ? "text-mint/85" : "text-charcoal/75"),
    // Borders are solid sage so the field edge reaches 3:1 against the panel.
    input: cn(
      "w-full rounded-xl border px-4 py-3 text-base transition-colors focus:outline-none",
      dark
        ? "bg-forest/70 border-sage text-neutral placeholder:text-mint/60 focus:border-mint aria-invalid:border-danger-soft"
        : "bg-neutral/60 border-sage text-charcoal placeholder:text-charcoal/70 focus:border-forest aria-invalid:border-danger",
    ),
    errorText: cn("mt-1.5 flex items-start gap-1.5 text-sm font-medium", dark ? "text-danger-soft" : "text-danger"),
  }
}

// Field attributes and inline error for a form with an id prefix. Errors are
// not live regions: the form focuses the first invalid field on submit, and
// aria-describedby reads its message, so several errors don't all announce at once.
export function fieldHelpers<K extends string>(prefix: string, errors: Partial<Record<K, string>>, errorClass: string) {
  return {
    props: (field: K) => ({
      id: `${prefix}-${field}`,
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": errors[field] ? `${prefix}-${field}-error` : undefined,
    }),
    error: (field: K) =>
      errors[field] ? (
        <p id={`${prefix}-${field}-error`} className={errorClass}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          {errors[field]}
        </p>
      ) : null,
  }
}

export function FallbackLinks() {
  const { email, whatsappUrl } = useSiteContact()
  return (
    <>
      email{" "}
      <a href={`mailto:${email}`} className="font-semibold underline underline-offset-4">
        {email}
      </a>{" "}
      or{" "}
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
        message us on WhatsApp
      </a>
    </>
  )
}

// Hidden from people and screen readers; bots fill it in.
export function Honeypot({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
      <label htmlFor={id}>Company website</label>
      <input id={id} type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export function SubmitButton({ sending, label, dark }: { sending: boolean; label: string; dark: boolean }) {
  return (
    <button
      type="submit"
      disabled={sending}
      className={cn(
        "btn-shine w-full inline-flex items-center justify-center gap-2 font-semibold px-7 py-4 rounded-xl transition-colors disabled:opacity-70",
        dark ? "bg-mint text-forest glow-mint" : "bg-forest text-neutral glow-forest hover:bg-forest-700",
      )}
    >
      {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
      {sending ? "Sending…" : label}
    </button>
  )
}

export function ConsentLine({ dark }: { dark: boolean }) {
  return (
    <p className={cn("text-sm", dark ? "text-mint" : "text-charcoal/80")}>
      We&apos;ll only use this to reply to you. See our{" "}
      <Link href="/privacy" className="font-semibold underline underline-offset-4">
        privacy policy
      </Link>
      .
    </p>
  )
}

// Posts a form and normalises the API's answer.
export async function submitForm(url: string, init: RequestInit) {
  try {
    const res = await fetch(url, { method: "POST", ...init })
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      reply?: string
      emailCopy?: boolean
      error?: string
      fields?: Record<string, string>
    }
    if (res.ok && data.ok && data.reply) return { ok: true as const, reply: data.reply, emailCopy: Boolean(data.emailCopy) }
    return { ok: false as const, error: data.error, fields: data.fields }
  } catch {
    return { ok: false as const, error: undefined, fields: undefined }
  }
}
