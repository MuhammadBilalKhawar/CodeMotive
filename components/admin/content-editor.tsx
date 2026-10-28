"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, ChevronDown, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Field as FieldLabel, SaveBar, inputClass, linesToList } from "@/components/admin/fields"
import { saveContentAction } from "@/app/admin/actions/content"
import { editorSpecs, type Field } from "@/lib/cms/fields"
import type { ContentKey } from "@/lib/content-registry"
import { uploadImage } from "@/lib/admin/upload-image"
import type { SaveResult } from "@/app/admin/actions/types"

type Value = unknown
type Obj = Record<string, Value>

type EditorProps = {
  contentKey: ContentKey
  initial: Value
  canSave: boolean
  // Display names for list items that only have a slug (guides).
  titles?: Record<string, string>
}

// Form for one content type, built from its field list in lib/cms/fields.ts.
export function ContentEditor({ contentKey, initial, canSave, titles }: EditorProps) {
  const spec = editorSpecs[contentKey]
  const router = useRouter()
  const [value, setValue] = useState<Value>(initial)
  const [saved, setSaved] = useState(() => JSON.stringify(initial))
  const [result, setResult] = useState<SaveResult | null>(null)
  const [saving, startSaving] = useTransition()
  const dirty = useMemo(() => JSON.stringify(value) !== saved, [value, saved])

  const save = () => {
    startSaving(async () => {
      const outcome = await saveContentAction(contentKey, value)
      setResult(outcome)
      if (outcome.ok) {
        setSaved(JSON.stringify(value))
        // Refresh the version history below the form.
        router.refresh()
      }
    })
  }

  return (
    <>
      <fieldset disabled={!canSave} className="space-y-6 min-w-0">
        <FieldEditor field={spec.field} value={value} onChange={setValue} titles={titles} root />
      </fieldset>
      <SaveBar dirty={dirty} saving={saving} disabled={!canSave} result={result} onSave={save} />
    </>
  )
}

type FieldEditorProps = { field: Field; value: Value; onChange: (value: Value) => void; titles?: Record<string, string>; root?: boolean }

function FieldEditor({ field, value, onChange, titles, root }: FieldEditorProps) {
  switch (field.type) {
    case "text":
      return <TextInput field={field} value={String(value ?? "")} onChange={onChange} />
    case "number":
      return (
        <FieldLabel label={field.label} hint={field.hint}>
          <input
            type="number"
            min={1}
            className={cn(inputClass, "max-w-40")}
            value={Number.isFinite(value) ? String(value) : ""}
            onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          />
        </FieldLabel>
      )
    case "toggle":
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-forest" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>
            <span className="block text-sm font-semibold text-forest">{field.label}</span>
            {field.hint && <span className="block text-xs text-charcoal/70 mt-0.5">{field.hint}</span>}
          </span>
        </label>
      )
    case "lines":
      return <LinesInput label={field.label} hint={field.hint} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />
    case "image":
      return <ImageInput label={field.label} hint={field.hint} value={String(value ?? "")} onChange={onChange} />
    case "readonly":
      return (
        <div>
          <span className="block text-sm font-semibold text-forest mb-1.5">{field.label}</span>
          <p className="rounded-lg bg-neutral border border-sage/20 px-3 py-2 text-sm text-charcoal/80 font-mono">{String(value ?? "")}</p>
          {field.hint && <span className="block text-xs text-charcoal/70 mt-1">{field.hint}</span>}
        </div>
      )
    case "group": {
      const obj = (value ?? {}) as Obj
      const inner = field.fields.map((child) => (
        <FieldEditor
          key={child.key}
          field={child}
          value={obj[child.key]}
          onChange={(v) => onChange({ ...obj, [child.key]: v })}
          titles={titles}
        />
      ))
      if (root) return <div className="space-y-6">{inner}</div>
      return (
        <section className="rounded-2xl border border-sage/25 bg-white p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-heading font-bold text-lg text-forest">{field.label}</h2>
            {field.hint && <p className="text-sm text-charcoal/75 mt-0.5">{field.hint}</p>}
          </div>
          {inner}
        </section>
      )
    }
    case "list":
      return <ListEditor field={field} value={Array.isArray(value) ? (value as Obj[]) : []} onChange={onChange} titles={titles} root={root} />
  }
}

function TextInput({ field, value, onChange }: { field: Extract<Field, { type: "text" }>; value: string; onChange: (v: string) => void }) {
  const over = field.max !== undefined && value.trim().length > field.max
  return (
    <FieldLabel label={field.label} hint={field.hint}>
      {field.long ? (
        <textarea rows={3} className={cn(inputClass, "resize-y", over && "border-red-600")} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cn(inputClass, over && "border-red-600")} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.max !== undefined && (
        <span className={cn("block text-right text-xs mt-1", over ? "text-red-700 font-semibold" : "text-charcoal/60")}>
          {value.trim().length}/{field.max}
        </span>
      )}
    </FieldLabel>
  )
}

// One item per line. Keeps the raw text so blank lines can be typed.
function LinesInput({ label, hint, value, onChange }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(() => value.join("\n"))
  return (
    <FieldLabel label={label} hint={hint}>
      <textarea
        rows={Math.min(8, Math.max(3, value.length + 1))}
        className={cn(inputClass, "resize-y")}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onChange(linesToList(e.target.value))
        }}
      />
    </FieldLabel>
  )
}

function ImageInput({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      onChange((await uploadImage(file, 800)).src)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.")
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div>
      <span className="block text-sm font-semibold text-forest mb-1.5">{label}</span>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-neutral border border-sage/30 flex items-center justify-center text-xs text-charcoal/60">
          {value ? <Image src={value} alt="" width={160} height={160} className="w-full h-full object-cover" /> : "No photo"}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={cn("inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-neutral cursor-pointer", uploading && "pointer-events-none opacity-50")}>
            <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <ImagePlus className="w-4 h-4" aria-hidden />}
            {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
          </label>
          {value && (
            <button type="button" onClick={() => onChange("")} className="rounded-lg border border-sage/40 px-4 py-2 text-sm font-semibold text-forest">
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-charcoal">⚠ {error}</p>}
      {hint && <span className="block text-xs text-charcoal/70 mt-1.5">{hint}</span>}
    </div>
  )
}

let keySeed = 0
const newKey = () => `item-${++keySeed}`

type ListProps = { field: Extract<Field, { type: "list" }>; value: Obj[]; onChange: (v: Obj[]) => void; titles?: Record<string, string>; root?: boolean }

function ListEditor({ field, value, onChange, titles, root }: ListProps) {
  // Stable keys so moving items doesn't mix up their inputs.
  const [keys, setKeys] = useState(() => value.map(newKey))
  const ids = keys.length === value.length ? keys : value.map((_, i) => keys[i] ?? newKey())

  const titleOf = (item: Obj, i: number) => {
    const raw = String(item[field.titleKey] ?? "").trim()
    return titles?.[raw] ?? (raw || `New ${field.itemLabel} ${i + 1}`)
  }

  const update = (i: number, item: Obj) => onChange(value.map((v, j) => (j === i ? item : v)))
  const move = (i: number, by: -1 | 1) => {
    const j = i + by
    if (j < 0 || j >= value.length) return
    const swap = <T,>(list: T[]) => {
      const copy = [...list]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    }
    setKeys(swap(ids))
    onChange(swap(value))
  }
  const remove = (i: number) => {
    if (!window.confirm(`Remove "${titleOf(value[i], i)}"? This takes effect when you save.`)) return
    setKeys(ids.filter((_, j) => j !== i))
    onChange(value.filter((_, j) => j !== i))
  }
  const add = () => {
    setKeys([...ids, newKey()])
    onChange([...value, structuredClone(field.blank ?? {})])
  }

  // Guides: one switch per item, so a compact row each.
  const compact = field.fields.length === 1 && field.fields[0].type === "toggle"

  const items = (
    <ul className="space-y-3">
      {value.map((item, i) => (
        <li key={ids[i]}>
          {compact ? (
            <div className="rounded-xl border border-sage/25 bg-white px-5 py-4 flex items-center justify-between gap-4">
              <span className="font-semibold text-forest">{titleOf(item, i)}</span>
              <FieldEditor field={field.fields[0]} value={item[field.fields[0].key]} onChange={(v) => update(i, { ...item, [field.fields[0].key]: v })} />
            </div>
          ) : (
            <details className="group rounded-xl border border-sage/25 bg-white">
              <summary className="cursor-pointer list-none px-5 py-3.5 flex items-center gap-3 [&::-webkit-details-marker]:hidden">
                <ChevronDown className="w-4 h-4 text-sage-600 transition-transform group-open:rotate-180" aria-hidden />
                <span className="font-semibold text-forest flex-1 min-w-0 truncate">{titleOf(item, i)}</span>
                {!field.fixed && (
                  <span className="flex gap-1">
                    <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                      <ArrowUp className="w-4 h-4" aria-hidden />
                    </IconButton>
                    <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                      <ArrowDown className="w-4 h-4" aria-hidden />
                    </IconButton>
                    <IconButton label={`Remove ${field.itemLabel}`} onClick={() => remove(i)}>
                      <Trash2 className="w-4 h-4" aria-hidden />
                    </IconButton>
                  </span>
                )}
              </summary>
              <div className="border-t border-sage/20 px-5 py-5 space-y-5">
                {field.fields.map((child) => (
                  <FieldEditor key={child.key} field={child} value={item[child.key]} onChange={(v) => update(i, { ...item, [child.key]: v })} titles={titles} />
                ))}
              </div>
            </details>
          )}
        </li>
      ))}
    </ul>
  )

  const addButton = !field.fixed && (
    <button type="button" onClick={add} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sage/40 bg-white px-4 py-2 text-sm font-semibold text-forest hover:border-forest">
      <Plus className="w-4 h-4" aria-hidden />
      Add {field.itemLabel}
    </button>
  )

  if (root) {
    return (
      <div>
        {value.length === 0 && <p className="rounded-xl border border-dashed border-sage/40 px-5 py-6 text-sm text-charcoal/75">Nothing here yet.</p>}
        {items}
        {addButton}
      </div>
    )
  }
  return (
    <section className="rounded-2xl border border-sage/25 bg-neutral/60 p-5 sm:p-6">
      <h3 className="font-heading font-bold text-base text-forest">{field.label}</h3>
      {field.hint && <p className="text-sm text-charcoal/75 mt-0.5 mb-3">{field.hint}</p>}
      <div className={cn(!field.hint && "mt-3")}>
        {value.length === 0 && <p className="text-sm text-charcoal/70 mb-2">None yet.</p>}
        {items}
        {addButton}
      </div>
    </section>
  )
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        // Don't toggle the <details> open/closed.
        e.preventDefault()
        onClick()
      }}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal/70 hover:bg-neutral hover:text-forest disabled:opacity-30"
    >
      {children}
    </button>
  )
}
