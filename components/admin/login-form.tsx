"use client"

import { useActionState } from "react"
import { KeyRound, Loader2, LogIn } from "lucide-react"
import { login, setupOwner, verifyTwoFactor } from "@/app/admin/actions/auth"
import type { FormState } from "@/app/admin/actions/types"
import { authButton, authInput, authLabel } from "@/components/admin/auth-card"

function ErrorLine({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-sm font-medium text-mint">
      ⚠ {message}
    </p>
  )
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {})
  const describedBy = state.error ? "login-error" : undefined
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="admin-email" className={authLabel}>Email</label>
        <input id="admin-email" name="email" type="email" autoComplete="username" required autoFocus defaultValue={state.values?.email} aria-describedby={describedBy} className={authInput} />
      </div>
      <div>
        <label htmlFor="admin-password" className={authLabel}>Password</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required aria-describedby={describedBy} className={authInput} />
      </div>
      <ErrorLine id="login-error" message={state.error} />
      <button type="submit" disabled={pending} className={authButton}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <LogIn className="w-4 h-4" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}

export function TwoFactorForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(verifyTwoFactor, {})
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="admin-code" className={authLabel}>6-digit code</label>
        <input
          id="admin-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          aria-describedby={state.error ? "code-error" : undefined}
          className={`${authInput} tracking-[0.4em] text-center text-lg`}
        />
      </div>
      <ErrorLine id="code-error" message={state.error} />
      <button type="submit" disabled={pending} className={authButton}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <KeyRound className="w-4 h-4" aria-hidden />}
        {pending ? "Checking…" : "Verify"}
      </button>
    </form>
  )
}

export function SetupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(setupOwner, {})
  const describedBy = state.error ? "setup-error" : undefined
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="setup-admin" className={authLabel}>Setup password</label>
        <input id="setup-admin" name="adminPassword" type="password" required autoFocus aria-describedby="setup-admin-hint" className={authInput} />
        <p id="setup-admin-hint" className="mt-1.5 text-xs text-mint/80">The ADMIN_PASSWORD from your environment variables.</p>
      </div>
      <div>
        <label htmlFor="setup-name" className={authLabel}>Your name</label>
        <input id="setup-name" name="name" autoComplete="name" required defaultValue={state.values?.name} aria-describedby={describedBy} className={authInput} />
      </div>
      <div>
        <label htmlFor="setup-email" className={authLabel}>Your email</label>
        <input id="setup-email" name="email" type="email" autoComplete="username" required defaultValue={state.values?.email} aria-describedby={describedBy} className={authInput} />
      </div>
      <div>
        <label htmlFor="setup-password" className={authLabel}>New password</label>
        <input id="setup-password" name="password" type="password" autoComplete="new-password" minLength={10} required aria-describedby="setup-password-hint" className={authInput} />
        <p id="setup-password-hint" className="mt-1.5 text-xs text-mint/80">At least 10 characters.</p>
      </div>
      <ErrorLine id="setup-error" message={state.error} />
      <button type="submit" disabled={pending} className={authButton}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <LogIn className="w-4 h-4" aria-hidden />}
        {pending ? "Creating…" : "Create owner account"}
      </button>
    </form>
  )
}
