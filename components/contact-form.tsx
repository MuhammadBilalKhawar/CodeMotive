"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { trackLead } from "@/lib/track"
import { findPackage, type PricingPackage } from "@/data/pricing"
import { contactServiceOptions, services } from "@/data/services"
import { budgetOptions, contactSchema, type ContactInput } from "@/lib/contact-schema"
import { useVisitor } from "@/components/visitor-provider"
import { ReplyCard, TypingBubble } from "@/components/reply-card"
import { Turnstile, turnstileSiteKey, useTurnstile } from "@/components/turnstile"
import {
  ConsentLine,
  FallbackLinks,
  Honeypot,
  SubmitButton,
  fieldHelpers,
  formStyles,
  submitForm,
  type FormTone,
} from "@/components/form-kit"

const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ")

type Status = "idle" | "sending" | "success" | "error"
type FieldErrors = Partial<Record<keyof ContactInput, string>>

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  business: "",
  country: "",
  service: "",
  budget: "",
  message: "",
  company_website: "",
}

const serviceForPackage = (packageId: string) =>
  services.find((s) => s.packageIds.includes(packageId))?.contactLabel ?? ""

type ContactFormProps = {
  packages: PricingPackage[]
  tone?: FormTone
}

export function ContactForm({ packages, tone = "light" }: ContactFormProps) {
  const { country: ipCountry } = useVisitor()
  const [form, setForm] = useState(emptyForm)
  const [packageId, setPackageId] = useState<string | null>(null)
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>("idle")
  const [serverError, setServerError] = useState<string | null>(null)
  const [result, setResult] = useState<{ reply: string; emailCopy: boolean } | null>(null)
  const turnstile = useTurnstile()

  // Country names come from the browser so server and client HTML never disagree.
  useEffect(() => {
    const names = new Intl.DisplayNames(["en"], { type: "region" })
    setCountries(
      COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name)),
    )
  }, [])

  // Pre-select the service when arriving from a "Get a quote" button (?package=<id>).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("package")
    if (id && findPackage(packages, id)) {
      setPackageId(id)
      setForm((f) => ({ ...f, service: serviceForPackage(id) }))
    }
  }, [packages])

  useEffect(() => {
    if (ipCountry && COUNTRY_CODES.includes(ipCountry)) {
      setForm((f) => (f.country ? f : { ...f, country: ipCountry }))
    }
  }, [ipCountry])

  const currency = form.country === "PK" ? "PKR" : "USD"
  const set = (field: keyof typeof emptyForm) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value, ...(field === "country" && { budget: "" }) }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }
  const onChange = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(field)(e.target.value)

  const showErrors = (fieldErrors: FieldErrors) => {
    setErrors(fieldErrors)
    const firstField = Object.keys(fieldErrors)[0]
    if (firstField) document.getElementById(`contact-${firstField}`)?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const parsed = contactSchema.safeParse({ ...form, package: packageId ?? undefined })
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as keyof ContactInput] ??= issue.message
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

    const outcome = await submitForm("/api/contact", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...parsed.data, company_website: form.company_website, turnstileToken: turnstileToken || undefined }),
    })
    if (outcome.ok) {
      setResult(outcome)
      setStatus("success")
      trackLead("contact")
      return
    }
    if (outcome.fields) showErrors(outcome.fields as FieldErrors)
    setServerError(outcome.error ?? null)
    setStatus("error")
    turnstile.reset()
  }

  const styles = formStyles(tone)
  const { dark } = styles
  const field = fieldHelpers<keyof ContactInput>("contact", errors, styles.errorText)

  if (status === "success" && result) {
    const firstName = form.name.trim().split(/\s+/)[0]
    return (
      <ReplyCard
        tone={tone}
        title={`Thanks, ${firstName}!`}
        reply={result.reply}
        footer={result.emailCopy ? <>We&apos;ve also emailed this to {form.email}.</> : undefined}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate {...turnstile.formProps} className={cn("rounded-3xl p-6 sm:p-9 space-y-5", styles.panel)}>
      {packageId && (
        <p className={cn("text-sm rounded-lg px-4 py-3", dark ? "bg-forest text-mint" : "bg-mint/40 text-forest")}>
          Package: <strong>{findPackage(packages, packageId)?.name}</strong>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="contact-name" className={styles.label}>Name *</label>
          <input {...field.props("name")} type="text" autoComplete="name" required value={form.name} onChange={onChange("name")} className={styles.input} />
          {field.error("name")}
        </div>
        <div>
          <label htmlFor="contact-email" className={styles.label}>Email *</label>
          <input {...field.props("email")} type="email" autoComplete="email" required value={form.email} onChange={onChange("email")} className={styles.input} />
          {field.error("email")}
        </div>
        <div>
          <label htmlFor="contact-phone" className={styles.label}>WhatsApp / phone</label>
          <input {...field.props("phone")} type="tel" autoComplete="tel" placeholder="+92 300 1234567" value={form.phone} onChange={onChange("phone")} className={styles.input} />
          {field.error("phone")}
        </div>
        <div>
          <label htmlFor="contact-business" className={styles.label}>Business name</label>
          <input {...field.props("business")} type="text" autoComplete="organization" value={form.business} onChange={onChange("business")} className={styles.input} />
          {field.error("business")}
        </div>
        <div>
          <label htmlFor="contact-country" className={styles.label}>Country *</label>
          <select {...field.props("country")} required value={form.country} onChange={onChange("country")} className={styles.input}>
            <option value="">Select your country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          {field.error("country")}
        </div>
        <div>
          <label htmlFor="contact-service" className={styles.label}>Service needed *</label>
          <select {...field.props("service")} required value={form.service} onChange={onChange("service")} className={styles.input}>
            <option value="">Select a service</option>
            {contactServiceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {field.error("service")}
        </div>
      </div>

      <div>
        <label htmlFor="contact-budget" className={styles.label}>Budget ({currency})</label>
        <select {...field.props("budget")} value={form.budget} onChange={onChange("budget")} className={styles.input}>
          <option value="">Select a range</option>
          {budgetOptions[currency].map((option) => (
            <option key={option} value={option}>{currency === "PKR" && option !== "Not sure" ? `PKR ${option}` : option}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className={styles.label}>Message *</label>
        <textarea
          {...field.props("message")}
          required
          rows={5}
          minLength={20}
          maxLength={2000}
          placeholder="What does your business do, and what do you need? Ask us anything about prices or timelines."
          value={form.message}
          onChange={onChange("message")}
          className={cn(styles.input, "resize-y")}
        />
        {field.error("message")}
      </div>

      <Honeypot id="contact-company_website" value={form.company_website} onChange={set("company_website")} />
      <Turnstile active={turnstile.active} onToken={turnstile.onToken} theme={dark ? "dark" : "light"} resetKey={turnstile.resetKey} />

      {status === "sending" && <TypingBubble tone={tone} />}
      {status === "error" && (
        <p className={styles.errorText} role="alert">
          {serverError ?? "Something went wrong sending your message."} You can also <FallbackLinks />.
        </p>
      )}
      {status !== "error" && serverError && (
        <p className={styles.errorText} role="alert">
          {serverError}
        </p>
      )}

      <SubmitButton sending={status === "sending"} label="Send message" dark={dark} />
      <ConsentLine dark={dark} />
    </form>
  )
}
