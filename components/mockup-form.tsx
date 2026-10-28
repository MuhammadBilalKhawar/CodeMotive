"use client"

import { useEffect, useState } from "react"
import { Check, ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { trackLead } from "@/lib/track"
import { LOGO_MAX_BYTES, LOGO_TYPES, businessTypes, mockupFeatures, mockupSchema, type MockupInput } from "@/lib/mockup-schema"
import { ReplyCard, TypingBubble } from "@/components/reply-card"
import { Turnstile, turnstileSiteKey, useTurnstile } from "@/components/turnstile"
import { ConsentLine, FallbackLinks, Honeypot, SubmitButton, fieldHelpers, formStyles, submitForm } from "@/components/form-kit"

type Status = "idle" | "sending" | "success" | "error"
type FieldName = keyof MockupInput | "logo"
type FieldErrors = Partial<Record<FieldName, string>>
type Feature = (typeof mockupFeatures)[number]

const emptyForm = {
  name: "",
  email: "",
  whatsapp: "",
  business: "",
  businessType: "",
  businessTypeOther: "",
  location: "",
  currentLink: "",
  sells: "",
  brandColours: "",
  likedSite1: "",
  likedSite2: "",
  notes: "",
  company_website: "",
}
type TextField = keyof typeof emptyForm

// "instagram.com/shop" -> "https://instagram.com/shop"
const withProtocol = (url: string) => {
  const trimmed = url.trim()
  return trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed
}

export function MockupForm() {
  const [form, setForm] = useState(emptyForm)
  const [features, setFeatures] = useState<Feature[]>([])
  const [logo, setLogo] = useState<File | null>(null)
  const [ref, setRef] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>("idle")
  const [serverError, setServerError] = useState<string | null>(null)
  const [result, setResult] = useState<{ reply: string; emailCopy: boolean } | null>(null)
  const turnstile = useTurnstile()

  // Outreach batch, e.g. /free-mockup?ref=email-batch-3
  useEffect(() => {
    setRef((new URLSearchParams(window.location.search).get("ref") ?? "").slice(0, 60))
  }, [])

  const set = (name: TextField) => (value: string) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((errs) => ({ ...errs, [name === "likedSite1" || name === "likedSite2" ? "likedSites" : name]: undefined }))
  }
  const onChange = (name: TextField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(name)(e.target.value)

  const toggleFeature = (feature: Feature) =>
    setFeatures((list) => (list.includes(feature) ? list.filter((f) => f !== feature) : [...list, feature]))

  const pickLogo = (file: File | undefined) => {
    setErrors((errs) => ({ ...errs, logo: undefined }))
    if (!file) return setLogo(null)
    if (!LOGO_TYPES.includes(file.type)) return setErrors((errs) => ({ ...errs, logo: "Please use a PNG, JPG or SVG file." }))
    if (file.size > LOGO_MAX_BYTES) return setErrors((errs) => ({ ...errs, logo: "Please use a file under 4 MB." }))
    setLogo(file)
  }

  const showErrors = (fieldErrors: FieldErrors) => {
    setErrors(fieldErrors)
    const first = Object.keys(fieldErrors)[0]
    if (first) document.getElementById(`mockup-${first === "likedSites" ? "likedSite1" : first}`)?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const data = {
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
      business: form.business,
      businessType: form.businessType,
      businessTypeOther: form.businessTypeOther,
      location: form.location,
      currentLink: withProtocol(form.currentLink),
      sells: form.sells,
      features,
      brandColours: form.brandColours,
      likedSites: [withProtocol(form.likedSite1), withProtocol(form.likedSite2)].filter(Boolean),
      notes: form.notes,
      ref,
    }
    const parsed = mockupSchema.safeParse(data)
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as FieldName] ??= issue.message
      showErrors(fieldErrors)
      return
    }
    setStatus("sending")
    const turnstileToken = await turnstile.waitForToken()
    if (turnstileSiteKey && !turnstileToken) {
      setStatus("idle")
      setServerError("Please complete the quick check above the button.")
      return
    }

    const body = new FormData()
    body.append("data", JSON.stringify({ ...parsed.data, company_website: form.company_website, turnstileToken: turnstileToken || undefined }))
    if (logo) body.append("logo", logo)

    const outcome = await submitForm("/api/free-mockup", { body })
    if (outcome.ok) {
      setResult(outcome)
      setStatus("success")
      trackLead("mockup")
      return
    }
    if (outcome.fields) showErrors(outcome.fields as FieldErrors)
    setServerError(outcome.error ?? null)
    setStatus("error")
    turnstile.reset()
  }

  const styles = formStyles("light")
  const field = fieldHelpers<FieldName>("mockup", errors, styles.errorText)

  if (status === "success" && result) {
    const firstName = form.name.trim().split(/\s+/)[0]
    return (
      <ReplyCard
        title={`Thanks, ${firstName}!`}
        reply={result.reply}
        footer={
          <>
            We&apos;ll email your mockup to <strong>{form.email}</strong>
            {result.emailCopy ? ", and we've just sent you a copy of this message." : "."}
          </>
        }
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate {...turnstile.formProps} className={cn("rounded-3xl p-6 sm:p-9 space-y-8", styles.panel)}>
      <fieldset className="space-y-5">
        <legend className="font-heading font-bold text-lg text-forest mb-4">About you</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="mockup-name" className={styles.label}>Your name *</label>
            <input {...field.props("name")} autoComplete="name" value={form.name} onChange={onChange("name")} className={styles.input} />
            {field.error("name")}
          </div>
          <div>
            <label htmlFor="mockup-email" className={styles.label}>Email *</label>
            <input {...field.props("email")} type="email" autoComplete="email" value={form.email} onChange={onChange("email")} className={styles.input} />
            {field.error("email")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="mockup-whatsapp" className={styles.label}>WhatsApp</label>
            <input {...field.props("whatsapp")} type="tel" autoComplete="tel" placeholder="+92 300 1234567" value={form.whatsapp} onChange={onChange("whatsapp")} className={styles.input} />
            {field.error("whatsapp")}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-heading font-bold text-lg text-forest mb-4">Your business</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="mockup-business" className={styles.label}>Business name *</label>
            <input {...field.props("business")} autoComplete="organization" value={form.business} onChange={onChange("business")} className={styles.input} />
            {field.error("business")}
          </div>
          <div>
            <label htmlFor="mockup-businessType" className={styles.label}>Business type *</label>
            <select {...field.props("businessType")} value={form.businessType} onChange={onChange("businessType")} className={styles.input}>
              <option value="">Select one</option>
              {businessTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            {field.error("businessType")}
          </div>
          {form.businessType === "Other" && (
            <div className="sm:col-span-2">
              <label htmlFor="mockup-businessTypeOther" className={styles.label}>What type of business? *</label>
              <input {...field.props("businessTypeOther")} value={form.businessTypeOther} onChange={onChange("businessTypeOther")} className={styles.input} />
              {field.error("businessTypeOther")}
            </div>
          )}
          <div>
            <label htmlFor="mockup-location" className={styles.label}>City and country *</label>
            <input {...field.props("location")} placeholder="Lahore, Pakistan" value={form.location} onChange={onChange("location")} className={styles.input} />
            {field.error("location")}
          </div>
          <div>
            <label htmlFor="mockup-currentLink" className={styles.label}>Current website or social page</label>
            <input
              {...field.props("currentLink")}
              inputMode="url"
              placeholder="instagram.com/yourbusiness"
              value={form.currentLink}
              onChange={onChange("currentLink")}
              className={styles.input}
            />
            {field.error("currentLink")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="mockup-sells" className={styles.label}>What do you sell, or what are your main services? *</label>
            <input {...field.props("sells")} maxLength={300} value={form.sells} onChange={onChange("sells")} className={styles.input} />
            {field.error("sells")}
          </div>
        </div>

        <div role="group" aria-labelledby="mockup-features-label">
          <p id="mockup-features-label" className={styles.label}>What should customers be able to do on the site?</p>
          <div className="flex flex-wrap gap-2">
            {mockupFeatures.map((feature) => {
              const checked = features.includes(feature)
              return (
                <label
                  key={feature}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium cursor-pointer transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-forest",
                    checked ? "bg-forest text-neutral border-forest" : "bg-white text-forest border-sage/40 hover:border-forest",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleFeature(feature)} />
                  {checked && <Check className="w-3.5 h-3.5" aria-hidden />}
                  {feature}
                </label>
              )
            })}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-heading font-bold text-lg text-forest mb-4">Look and feel (optional)</legend>
        <div>
          <p className={styles.label} id="mockup-logo-label">Logo</p>
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="mockup-logo"
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-sage/60 bg-neutral/60 px-4 py-3 text-sm font-semibold text-forest cursor-pointer hover:border-forest has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-forest"
            >
              <ImagePlus className="w-4 h-4" aria-hidden />
              {logo ? "Change file" : "Upload logo"}
              <input
                id="mockup-logo"
                type="file"
                accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                className="sr-only"
                aria-describedby="mockup-logo-hint"
                onChange={(e) => pickLogo(e.target.files?.[0])}
              />
            </label>
            {logo && (
              <span className="inline-flex items-center gap-2 text-sm text-charcoal">
                {logo.name} ({Math.ceil(logo.size / 1024)} KB)
                <button type="button" onClick={() => setLogo(null)} aria-label="Remove logo" className="p-1 rounded-md hover:bg-neutral">
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </span>
            )}
          </div>
          <span id="mockup-logo-hint" className={styles.hint}>PNG, JPG or SVG, up to 4 MB.</span>
          {field.error("logo")}
        </div>
        <div>
          <label htmlFor="mockup-brandColours" className={styles.label}>Brand colours</label>
          <input
            {...field.props("brandColours")}
            placeholder="e.g. dark green and gold, or #0F2D23"
            value={form.brandColours}
            onChange={onChange("brandColours")}
            className={styles.input}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="mockup-likedSite1" className={styles.label}>A website you like</label>
            <input
              id="mockup-likedSite1"
              inputMode="url"
              aria-invalid={Boolean(errors.likedSites)}
              aria-describedby={errors.likedSites ? "mockup-likedSites-error" : undefined}
              value={form.likedSite1}
              onChange={onChange("likedSite1")}
              className={styles.input}
            />
          </div>
          <div>
            <label htmlFor="mockup-likedSite2" className={styles.label}>Another website you like</label>
            <input id="mockup-likedSite2" inputMode="url" value={form.likedSite2} onChange={onChange("likedSite2")} className={styles.input} />
          </div>
          <div className="sm:col-span-2 -mt-3">{field.error("likedSites")}</div>
        </div>
        <div>
          <label htmlFor="mockup-notes" className={styles.label}>Anything else?</label>
          <textarea
            {...field.props("notes")}
            rows={4}
            maxLength={2000}
            placeholder="Ideas, must-haves, or questions for us"
            value={form.notes}
            onChange={onChange("notes")}
            className={cn(styles.input, "resize-y")}
          />
          {field.error("notes")}
        </div>
      </fieldset>

      <Honeypot id="mockup-company_website" value={form.company_website} onChange={set("company_website")} />
      <Turnstile active={turnstile.active} onToken={turnstile.onToken} resetKey={turnstile.resetKey} />

      {status === "sending" && <TypingBubble />}
      {status === "error" && (
        <p className={styles.errorText} role="alert">
          {serverError ?? "Something went wrong sending your request."} You can also <FallbackLinks />.
        </p>
      )}
      {status !== "error" && serverError && (
        <p className={styles.errorText} role="alert">
          {serverError}
        </p>
      )}

      <div className="space-y-4">
        <SubmitButton sending={status === "sending"} label="Request my free mockup" dark={false} />
        <ConsentLine dark={false} />
      </div>
    </form>
  )
}
