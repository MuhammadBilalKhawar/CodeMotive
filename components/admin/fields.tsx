"use client"

import { useEffect } from "react"
import { CheckCircle2, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SaveResult } from "@/app/admin/actions/types"

export const inputClass =
  "w-full rounded-lg border border-sage/40 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/50 focus:border-forest focus:outline-none disabled:bg-neutral"

type FieldProps = {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}

// Wraps one control so the label is attached to it.
export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-sm font-semibold text-forest mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-charcoal/70 mt-1">{hint}</span>}
    </label>
  )
}

export const linesToList = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

// "" -> null, otherwise a whole number (NaN is caught by schema validation).
export const toNumberOrNull = (text: string) => (text.trim() === "" ? null : Number(text))

type SaveBarProps = {
  dirty: boolean
  saving: boolean
  disabled?: boolean
  result: SaveResult | null
  onSave: () => void
}

// Sticky footer with the save button and the outcome of the last save.
export function SaveBar({ dirty, saving, disabled, result, onSave }: SaveBarProps) {
  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  return (
    <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 mt-10 border-t border-sage/20 bg-neutral/95 backdrop-blur px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="text-sm" role="status" aria-live="polite">
          {result && !result.ok && <p className="font-medium text-charcoal whitespace-pre-line">⚠ {result.error}</p>}
          {result?.ok && !dirty && (
            <p className="inline-flex items-center gap-1.5 font-medium text-sage-600">
              <CheckCircle2 className="w-4 h-4" aria-hidden />
              Saved. The website is updated.
            </p>
          )}
          {dirty && <p className="text-charcoal/80">You have unsaved changes.</p>}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving || disabled}
          className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-6 py-3 font-semibold text-neutral glow-forest disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  )
}
