"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X } from "lucide-react"
import { addExpenseAction, removeExpenseAction } from "@/app/admin/actions/delivery"
import { Field, inputClass } from "@/components/admin/fields"
import { Notice, buttonClass } from "@/components/admin/ui"
import { money } from "@/lib/billing/schemas"
import { expenseCategories, expenseCategoryLabels, type ExpenseCategory } from "@/lib/delivery/schemas"

type ExpenseRow = { id: string; date: string; description: string; category: ExpenseCategory; amount: number; currency: "PKR" | "USD" }

// Costs on a project (domain, apps, freelancers) and what's left from the money received.
export function Expenses({ projectId, expenses, received, currency, today }: { projectId: string; expenses: ExpenseRow[]; received: Record<"PKR" | "USD", number>; currency: "PKR" | "USD"; today: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ date: today, description: "", category: "domain" as ExpenseCategory, amount: "", currency })
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const spent = (c: "PKR" | "USD") => expenses.filter((e) => e.currency === c).reduce((sum, e) => sum + e.amount, 0)
  const rows = (["PKR", "USD"] as const).filter((c) => received[c] > 0 || spent(c) > 0)

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await addExpenseAction(projectId, { ...form, amount: form.amount.trim() === "" ? Number.NaN : Number(form.amount.replace(/[, ]/g, "")) })
      if (!result.ok) return setError(result.error)
      setForm((f) => ({ ...f, description: "", amount: "" }))
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      {rows.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rows.flatMap((c) => [
            <div key={`${c}-in`} className="rounded-xl bg-neutral p-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-sage-600">Received ({c})</dt>
              <dd className="font-semibold text-forest">{money(received[c], c)}</dd>
            </div>,
            <div key={`${c}-out`} className="rounded-xl bg-neutral p-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-sage-600">Costs ({c})</dt>
              <dd className="font-semibold text-forest">{money(spent(c), c)}</dd>
            </div>,
            <div key={`${c}-net`} className="rounded-xl bg-mint/50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-sage-600">Left so far ({c})</dt>
              <dd className="font-bold text-forest">{money(received[c] - spent(c), c).replace("Rs -", "-Rs ").replace("$-", "-$")}</dd>
            </div>,
          ])}
        </dl>
      )}

      {expenses.length > 0 && (
        <ul className="divide-y divide-sage/15">
          {expenses.map((e) => (
            <li key={e.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-forest">{money(e.amount, e.currency)}</span>
              <span>{e.description}</span>
              <span className="text-xs text-charcoal/60">
                {expenseCategoryLabels[e.category]} · {e.date}
              </span>
              <button
                type="button"
                className="ml-auto text-charcoal/60 hover:text-charcoal"
                aria-label={`Remove ${e.description}`}
                onClick={() =>
                  window.confirm(`Remove "${e.description}"?`) &&
                  startTransition(async () => {
                    const result = await removeExpenseAction(projectId, e.id)
                    if (!result.ok) setError(result.error)
                    router.refresh()
                  })
                }
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="What for">
            <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Domain for 1 year" />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
              {expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {expenseCategoryLabels[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount">
            <div className="flex gap-2">
              <select aria-label="Currency" className={`${inputClass} w-20`} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as "PKR" | "USD" })}>
                <option>PKR</option>
                <option>USD</option>
              </select>
              <input inputMode="numeric" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </Field>
          <Field label="Date">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>
        <button type="submit" disabled={pending} className={buttonClass.secondary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
          Add cost
        </button>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}
