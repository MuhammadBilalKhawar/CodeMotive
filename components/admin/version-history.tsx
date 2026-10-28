"use client"

import { useState, useTransition } from "react"
import { History, Loader2, RotateCcw } from "lucide-react"
import { restoreVersionAction } from "@/app/admin/actions/content"
import { Notice, buttonClass } from "@/components/admin/ui"

type Version = { id: string; savedAt: string; savedBy: string }

// Earlier saved versions of a piece of content, with one-click restore.
export function VersionHistory({ contentKey, versions }: { contentKey: string; versions: Version[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const restore = (v: Version) => {
    if (!window.confirm(`Restore the version saved ${v.savedAt} by ${v.savedBy}? The current version is kept in history, so you can undo this.`)) return
    startTransition(async () => {
      const result = await restoreVersionAction(contentKey, v.id)
      if (result.ok) {
        setError(null)
        // Reload the editor with the restored content.
        window.location.reload()
      } else setError(result.error)
    })
  }

  return (
    <details className="group rounded-2xl border border-sage/25 bg-white">
      <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-2 font-semibold text-forest [&::-webkit-details-marker]:hidden">
        <History className="w-4 h-4" aria-hidden />
        Version history
        <span className="text-sm font-normal text-charcoal/70">({versions.length} earlier {versions.length === 1 ? "version" : "versions"})</span>
      </summary>
      <div className="border-t border-sage/20 px-5 py-4 space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        {versions.length === 0 ? (
          <p className="text-sm text-charcoal/80">No earlier versions yet. Each save keeps the previous version here.</p>
        ) : (
          <ul className="divide-y divide-sage/15">
            {versions.map((v) => (
              <li key={v.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <span>
                  {v.savedAt} <span className="text-charcoal/70">· {v.savedBy}</span>
                </span>
                <button type="button" disabled={pending} onClick={() => restore(v)} className={buttonClass.quiet}>
                  {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <RotateCcw className="w-3.5 h-3.5" aria-hidden />}
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}

