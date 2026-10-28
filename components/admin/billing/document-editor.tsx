"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createInvoiceAction, createQuoteAction, updateInvoiceAction, updateQuoteAction } from "@/app/admin/actions/billing"
import { Field, inputClass } from "@/components/admin/fields"
import { Card, Notice, buttonClass } from "@/components/admin/ui"
import { documentTotal, lineTotal, money, splitTotal, subtotal, type InvoiceInput, type LineItem, type QuoteInput } from "@/lib/billing/schemas"

export type PackageOption = { id: string; name: string; features: string[]; priceFrom: { PKR: number | null; USD: number | null }; unit: "one-time" | "monthly" }
export type ClientOption = { id: string; name: string; business: string; email: string; address: string; currency: "PKR" | "USD" }

type Props =
  | { mode: "quote"; docId?: string; initial: QuoteInput; packages: PackageOption[]; clients: ClientOption[] }
  | { mode: "invoice"; docId?: string; initial: InvoiceInput; packages: PackageOption[]; clients: ClientOption[] }

type Draft = QuoteInput & InvoiceInput

const blankLine = (): LineItem => ({ description: "", details: "", quantity: 1, unitPrice: 0 })
const numberOrNaN = (text: string) => (text.trim() === "" ? Number.NaN : Number(text.replace(/[, ]/g, "")))

// Quote and invoice form: who it's for, package and add-on lines, discount,
// payment split (quotes) or dates (invoices), and notes.
export function DocumentEditor(props: Props) {
  const { mode, docId, packages, clients } = props
  const router = useRouter()
  const [doc, setDoc] = useState<Draft>(props.initial as Draft)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(props.initial))
  const [pending, startTransition] = useTransition()
  const dirty = JSON.stringify(doc) !== savedJson

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDoc((d) => ({ ...d, [key]: value }))
    setSaved(false)
  }
  const setItem = (i: number, patch: Partial<LineItem>) => set("items", doc.items.map((item, j) => (j === i ? { ...item, ...patch } : item)))
  const moveItem = (i: number, by: -1 | 1) => {
    const j = i + by
    if (j < 0 || j >= doc.items.length) return
    const items = [...doc.items]
    ;[items[i], items[j]] = [items[j], items[i]]
    set("items", items)
  }

  const addPackage = (id: string) => {
    const pkg = packages.find((p) => p.id === id)
    if (!pkg) return
    const line: LineItem = {
      description: pkg.unit === "monthly" ? `${pkg.name} (monthly)` : pkg.name,
      details: pkg.features.join(" · ").slice(0, 600),
      quantity: 1,
      unitPrice: pkg.priceFrom[doc.currency] ?? 0,
    }
    // Replace an empty first line instead of adding below it.
    set("items", doc.items.length === 1 && !doc.items[0].description ? [line] : [...doc.items, line])
  }

  const pickClient = (id: string) => {
    const client = clients.find((c) => c.id === id)
    if (!client) return set("clientId", "")
    setDoc((d) => ({ ...d, clientId: client.id, currency: client.currency, billTo: { name: client.name, business: client.business, email: client.email, address: client.address } }))
    setSaved(false)
  }

  const total = documentTotal(doc)
  const parts = useMemo(() => (mode === "quote" ? splitTotal(total, doc.schedule) : []), [mode, total, doc.schedule])
  const percentSum = mode === "quote" ? doc.schedule.reduce((sum, p) => sum + (Number.isFinite(p.percent) ? p.percent : 0), 0) : 100

  const save = () => {
    setError(null)
    const payload =
      mode === "quote"
        ? { clientId: doc.clientId, leadId: doc.leadId, billTo: doc.billTo, currency: doc.currency, items: doc.items, discount: doc.discount, notes: doc.notes, title: doc.title, validUntil: doc.validUntil, schedule: doc.schedule }
        : { clientId: doc.clientId, leadId: doc.leadId, billTo: doc.billTo, currency: doc.currency, items: doc.items, discount: doc.discount, notes: doc.notes, issueDate: doc.issueDate, dueDate: doc.dueDate }
    startTransition(async () => {
      if (docId) {
        const result = mode === "quote" ? await updateQuoteAction(docId, payload) : await updateInvoiceAction(docId, payload)
        if (!result.ok) return setError(result.error)
        setSaved(true)
        setSavedJson(JSON.stringify(doc))
        router.refresh()
      } else {
        const result = mode === "quote" ? await createQuoteAction(payload) : await createInvoiceAction(payload)
        if (!result.ok) return setError(result.error)
        setSavedJson(JSON.stringify(doc))
        router.push(`/admin/${mode === "quote" ? "quotes" : "invoices"}/${result.data.id}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card title="For">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Client" hint={doc.leadId && !doc.clientId ? "From a lead. Becomes a client when the quote is accepted." : "Pick a client to fill in their details."} className="sm:col-span-2">
            <select className={inputClass} value={doc.clientId} onChange={(e) => pickClient(e.target.value)}>
              <option value="">{doc.leadId ? "Not a client yet (lead)" : "Choose a client…"}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.business ? `${c.business} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name">
            <input className={inputClass} value={doc.billTo.name} onChange={(e) => set("billTo", { ...doc.billTo, name: e.target.value })} />
          </Field>
          <Field label="Business">
            <input className={inputClass} value={doc.billTo.business} onChange={(e) => set("billTo", { ...doc.billTo, business: e.target.value })} />
          </Field>
          <Field label="Email" hint="Where the quote or invoice is emailed.">
            <input type="email" className={inputClass} value={doc.billTo.email} onChange={(e) => set("billTo", { ...doc.billTo, email: e.target.value })} />
          </Field>
          <Field label="Address (optional)">
            <textarea rows={2} className={cn(inputClass, "resize-y")} value={doc.billTo.address} onChange={(e) => set("billTo", { ...doc.billTo, address: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card title={mode === "quote" ? "What's included" : "Lines"}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 mb-5">
          {mode === "quote" ? (
            <Field label="Quote title" hint='e.g. "Restaurant website with online menu"'>
              <input className={inputClass} value={doc.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
          ) : (
            <div className="hidden sm:block" />
          )}
          <Field label="Currency" hint="Changing it doesn't convert prices.">
            <select className={cn(inputClass, "w-28")} value={doc.currency} onChange={(e) => set("currency", e.target.value as Draft["currency"])}>
              <option>PKR</option>
              <option>USD</option>
            </select>
          </Field>
        </div>

        <ol className="space-y-3">
          {doc.items.map((item, i) => (
            <li key={i} className="rounded-xl border border-sage/25 bg-neutral/40 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_130px] gap-3">
                <label className="block">
                  <span className="sr-only">Line {i + 1} description</span>
                  <input className={inputClass} placeholder="Description, e.g. Business Website" value={item.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                </label>
                <label className="block">
                  <span className="sr-only">Quantity</span>
                  <input inputMode="numeric" className={cn(inputClass, "text-right")} title="Quantity" value={Number.isFinite(item.quantity) ? item.quantity : ""} onChange={(e) => setItem(i, { quantity: numberOrNaN(e.target.value) })} />
                </label>
                <label className="block">
                  <span className="sr-only">Unit price</span>
                  <input inputMode="numeric" className={cn(inputClass, "text-right")} title="Unit price" placeholder="Price" value={Number.isFinite(item.unitPrice) ? item.unitPrice : ""} onChange={(e) => setItem(i, { unitPrice: numberOrNaN(e.target.value) })} />
                </label>
              </div>
              <label className="block mt-2">
                <span className="sr-only">Line {i + 1} details</span>
                <textarea rows={2} className={cn(inputClass, "resize-y text-xs")} placeholder="Details (optional): what's included" value={item.details} onChange={(e) => setItem(i, { details: e.target.value })} />
              </label>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-forest">{Number.isFinite(lineTotal(item)) ? money(lineTotal(item), doc.currency) : "–"}</span>
                <span className="flex gap-1">
                  <button type="button" className={buttonClass.quiet} aria-label="Move line up" onClick={() => moveItem(i, -1)} disabled={i === 0}>
                    <ArrowUp className="w-4 h-4" aria-hidden />
                  </button>
                  <button type="button" className={buttonClass.quiet} aria-label="Move line down" onClick={() => moveItem(i, 1)} disabled={i === doc.items.length - 1}>
                    <ArrowDown className="w-4 h-4" aria-hidden />
                  </button>
                  <button type="button" className={buttonClass.quiet} aria-label="Remove line" onClick={() => set("items", doc.items.filter((_, j) => j !== i))} disabled={doc.items.length === 1}>
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-3 flex flex-wrap gap-2">
          <label className="inline-flex">
            <span className="sr-only">Add a package</span>
            <select className={cn(inputClass, "w-auto")} value="" onChange={(e) => addPackage(e.target.value)}>
              <option value="">+ Add a package…</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.priceFrom[doc.currency] !== null ? `(from ${money(p.priceFrom[doc.currency]!, doc.currency)})` : "(custom)"}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className={buttonClass.secondary} onClick={() => set("items", [...doc.items, blankLine()])}>
            <Plus className="w-4 h-4" aria-hidden />
            Add-on or custom line
          </button>
        </div>

        <div className="mt-6 ml-auto w-full sm:w-80 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{Number.isFinite(subtotal(doc.items)) ? money(subtotal(doc.items), doc.currency) : "–"}</span>
          </div>
          <label className="flex items-center justify-between gap-3">
            <span>Discount</span>
            <input inputMode="numeric" className={cn(inputClass, "w-32 text-right")} value={Number.isFinite(doc.discount) ? doc.discount : ""} onChange={(e) => set("discount", e.target.value.trim() === "" ? 0 : numberOrNaN(e.target.value))} />
          </label>
          <div className="flex justify-between rounded-lg bg-mint/60 px-3 py-2 font-bold text-forest text-base">
            <span>Total</span>
            <span>{Number.isFinite(total) ? money(total, doc.currency) : "–"}</span>
          </div>
        </div>
      </Card>

      {mode === "quote" ? (
        <Card title="Payments and validity" description="How the total is split. The client sees each amount.">
          <ul className="space-y-2">
            {doc.schedule.map((part, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <label className="flex-1 min-w-[160px]">
                  <span className="sr-only">Payment {i + 1} name</span>
                  <input className={inputClass} value={part.label} onChange={(e) => set("schedule", doc.schedule.map((p, j) => (j === i ? { ...p, label: e.target.value } : p)))} />
                </label>
                <label className="flex items-center gap-1">
                  <span className="sr-only">Percent</span>
                  <input inputMode="numeric" className={cn(inputClass, "w-20 text-right")} value={Number.isFinite(part.percent) ? part.percent : ""} onChange={(e) => set("schedule", doc.schedule.map((p, j) => (j === i ? { ...p, percent: numberOrNaN(e.target.value) } : p)))} />
                  <span className="text-sm">%</span>
                </label>
                <span className="w-32 text-right text-sm font-semibold text-forest">{parts[i] && Number.isFinite(parts[i].amount) ? money(parts[i].amount, doc.currency) : "–"}</span>
                <button type="button" className={buttonClass.quiet} aria-label="Remove payment" onClick={() => set("schedule", doc.schedule.filter((_, j) => j !== i))} disabled={doc.schedule.length === 1}>
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className={buttonClass.quiet} onClick={() => set("schedule", [{ label: "Deposit to start", percent: 50 }, { label: "Balance on delivery", percent: 50 }])}>
              50 / 50
            </button>
            <button type="button" className={buttonClass.quiet} onClick={() => set("schedule", [{ label: "Paid upfront", percent: 100 }])}>
              100% upfront
            </button>
            {doc.schedule.length < 4 && (
              <button type="button" className={buttonClass.quiet} onClick={() => set("schedule", [...doc.schedule, { label: "Milestone", percent: 0 }])}>
                <Plus className="w-4 h-4" aria-hidden />
                Add payment
              </button>
            )}
            <span className={cn("ml-auto text-sm font-semibold", percentSum === 100 ? "text-sage-600" : "text-red-700")}>{percentSum}% of 100%</span>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Valid until">
              <input type="date" className={cn(inputClass, "w-44")} value={doc.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
            </Field>
          </div>
        </Card>
      ) : (
        <Card title="Dates">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Issue date">
              <input type="date" className={cn(inputClass, "w-44")} value={doc.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
            </Field>
            <Field label="Due date">
              <input type="date" className={cn(inputClass, "w-44")} value={doc.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </Field>
          </div>
        </Card>
      )}

      <Card title={mode === "quote" ? "Scope and notes" : "Notes"} description={mode === "quote" ? "Timeline, what's not included, assumptions. Your standard terms are added from Billing settings." : "Shown on the invoice."}>
        <textarea rows={5} className={cn(inputClass, "resize-y")} value={doc.notes} onChange={(e) => set("notes", e.target.value)} />
      </Card>

      {error && (
        <Notice tone="error">
          <span className="whitespace-pre-line">{error}</span>
        </Notice>
      )}
      <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 border-t sm:border sm:rounded-2xl border-sage/25 bg-neutral/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending || (Boolean(docId) && !dirty)} className={buttonClass.primary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          {docId ? "Save changes" : mode === "quote" ? "Create quote" : "Create invoice"}
        </button>
        {saved && !dirty && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600">
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            Saved
          </span>
        )}
        {dirty && docId && <span className="text-sm text-charcoal/75">Unsaved changes</span>}
        <span className="ml-auto text-sm font-semibold text-forest">{Number.isFinite(total) ? money(total, doc.currency) : ""}</span>
      </div>
    </div>
  )
}
