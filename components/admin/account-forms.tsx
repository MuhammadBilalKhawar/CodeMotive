"use client"

import { useActionState, useState, useTransition } from "react"
import Image from "next/image"
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import { changePassword, confirmTwoFactor, disableTwoFactor, signOutOtherDevices, startTwoFactorSetup } from "@/app/admin/actions/account"
import type { FormState } from "@/app/admin/actions/types"
import { Field, inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {})
  return (
    <form action={action} className="space-y-4 max-w-md">
      <Field label="Current password">
        <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <Field label="New password" hint="At least 10 characters">
        <input name="password" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </Field>
      <Field label="Repeat new password">
        <input name="confirm" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.message}</Notice>}
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
        Change password
      </button>
    </form>
  )
}

export function TwoFactorPanel({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null)
  const [code, setCode] = useState("")
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const begin = () =>
    startTransition(async () => {
      const result = await startTwoFactorSetup()
      if (result.ok) setSetup(result.data)
      else setMessage({ tone: "error", text: result.error })
    })

  const confirm = () =>
    startTransition(async () => {
      if (!setup) return
      const result = await confirmTwoFactor(setup.secret, code)
      if (result.ok) {
        setSetup(null)
        setCode("")
        setMessage({ tone: "success", text: "Two-factor sign-in is on. You'll need your app's code each time you sign in." })
      } else setMessage({ tone: "error", text: result.error })
    })

  const turnOff = () =>
    startTransition(async () => {
      const result = await disableTwoFactor(code)
      if (result.ok) {
        setCode("")
        setMessage({ tone: "success", text: "Two-factor sign-in is off." })
      } else setMessage({ tone: "error", text: result.error })
    })

  const codeInput = (
    <Field label="6-digit code from your app" className="max-w-xs">
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className={`${inputClass} tracking-[0.3em] text-center`}
      />
    </Field>
  )

  return (
    <div className="space-y-4">
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {enabled ? (
        <>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-sage-600">
            <ShieldCheck className="w-4 h-4" aria-hidden />
            On: you need your authenticator app to sign in.
          </p>
          {codeInput}
          <button type="button" onClick={turnOff} disabled={pending || code.length < 6} className={buttonClass.danger}>
            <ShieldOff className="w-4 h-4" aria-hidden />
            Turn off two-factor
          </button>
        </>
      ) : setup ? (
        <div className="space-y-4">
          <ol className="list-decimal pl-5 text-sm space-y-1">
            <li>Open Google Authenticator, Microsoft Authenticator or 1Password.</li>
            <li>Scan this QR code (or enter the key by hand).</li>
            <li>Type the 6-digit code it shows.</li>
          </ol>
          <Image src={setup.qr} alt="QR code for your authenticator app" width={220} height={220} unoptimized className="rounded-lg border border-sage/30" />
          <p className="text-xs text-charcoal/80 break-all">
            Key: <code className="font-mono">{setup.secret}</code>
          </p>
          {codeInput}
          <button type="button" onClick={confirm} disabled={pending || code.length < 6} className={buttonClass.primary}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            Confirm and turn on
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-charcoal/85">Off. Strongly recommended: it stops anyone who learns your password from signing in.</p>
          <button type="button" onClick={begin} disabled={pending} className={buttonClass.primary}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            <ShieldCheck className="w-4 h-4" aria-hidden />
            Set up two-factor sign-in
          </button>
        </>
      )}
    </div>
  )
}

export function SignOutOthersButton() {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await signOutOtherDevices()
            setDone(result.ok)
          })
        }
        className={buttonClass.secondary}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
        Sign out all other devices
      </button>
      {done && <Notice tone="success">Done. Every other device has been signed out.</Notice>}
    </div>
  )
}
