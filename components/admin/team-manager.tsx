"use client"

import { useActionState, useState, useTransition } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { addTeamMember, resetTeamPassword, updateTeamMember } from "@/app/admin/actions/account"
import type { FormState } from "@/app/admin/actions/types"
import { Field, inputClass } from "@/components/admin/fields"
import { Badge, Notice, buttonClass } from "@/components/admin/ui"

type Member = { id: string; name: string; email: string; role: "owner" | "member"; active: boolean; totpEnabled: boolean; lastLogin: string | null }

export function TeamTable({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null)
      const result = await fn()
      if (!result.ok) setError(result.error ?? "Something went wrong.")
    })

  const reset = (m: Member) => {
    const password = window.prompt(`New temporary password for ${m.name} (at least 10 characters). This also turns off their two-factor sign-in.`)
    if (password) run(() => resetTeamPassword(m.id, password))
  }

  return (
    <div className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}
      <div className="overflow-x-auto rounded-2xl border border-sage/25 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral text-left text-xs uppercase tracking-wider text-sage-600">
            <tr>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Role</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Last sign-in</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/15">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-forest">
                    {m.name} {m.id === currentUserId && <span className="text-xs font-normal text-charcoal/70">(you)</span>}
                  </span>
                  <span className="text-charcoal/80">{m.email}</span>
                </td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`role-${m.id}`}>Role for {m.name}</label>
                  <select
                    id={`role-${m.id}`}
                    value={m.role}
                    disabled={pending || m.id === currentUserId}
                    onChange={(e) => run(() => updateTeamMember(m.id, { role: e.target.value as Member["role"] }))}
                    className={`${inputClass} w-auto`}
                  >
                    <option value="owner">Owner</option>
                    <option value="member">Team member</option>
                  </select>
                </td>
                <td className="px-4 py-3 space-x-1">
                  <Badge tone={m.active ? "mint" : "warn"}>{m.active ? "Active" : "Deactivated"}</Badge>
                  {m.totpEnabled && <Badge tone="forest">2FA</Badge>}
                </td>
                <td className="px-4 py-3 text-charcoal/80">{m.lastLogin ?? "Never"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {m.id !== currentUserId && (
                    <>
                      <button type="button" disabled={pending} onClick={() => reset(m)} className={buttonClass.quiet}>
                        Reset password
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => updateTeamMember(m.id, { active: !m.active }))}
                        className={buttonClass.quiet}
                      >
                        {m.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AddMemberForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addTeamMember, {})
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Name">
        <input name="name" required defaultValue={state.values?.name} className={inputClass} />
      </Field>
      <Field label="Email">
        <input name="email" type="email" required defaultValue={state.values?.email} className={inputClass} />
      </Field>
      <Field label="Role" hint="Team members can't see quotes, invoices, billing or the team page">
        <select name="role" key={state.values?.role} defaultValue={state.values?.role ?? "owner"} className={inputClass}>
          <option value="owner">Owner</option>
          <option value="member">Team member</option>
        </select>
      </Field>
      <Field label="Temporary password" hint="At least 10 characters; share it privately">
        <input name="password" type="text" minLength={10} required autoComplete="off" className={inputClass} />
      </Field>
      <div className="sm:col-span-2 space-y-3">
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.message}</Notice>}
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <UserPlus className="w-4 h-4" aria-hidden />}
          Add account
        </button>
      </div>
    </form>
  )
}
