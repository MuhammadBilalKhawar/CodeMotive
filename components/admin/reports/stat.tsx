import Link from "next/link"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PerCurrency } from "@/lib/reports/compute"

// Stat tile: label, value, optional change against the previous period, optional note.
export function Stat({ label, value, delta, note, href }: { label: string; value: string; delta?: number | null; note?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-sage-600">{label}</p>
      <p className="font-heading font-bold text-2xl text-forest mt-1 leading-tight">{value}</p>
      {(delta !== undefined && delta !== null) || note ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-charcoal/70">
          {delta !== undefined && delta !== null && (
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", delta >= 0 ? "text-[#006300]" : "text-charcoal")}>
              {delta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" aria-hidden /> : <ArrowDownRight className="w-3.5 h-3.5" aria-hidden />}
              {delta >= 0 ? "+" : ""}
              {Math.round(delta * 100)}%<span className="sr-only"> compared with the period before</span>
            </span>
          )}
          {note && <span>{note}</span>}
        </p>
      ) : null}
    </>
  )
  const className = "block rounded-2xl border border-sage/25 bg-white p-5"
  return href ? (
    <Link href={href} className={cn(className, "hover:border-forest/40 transition-colors")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

// "Rs 85,000 + $1,200" (never added together); "Nothing" when both are zero.
export function perCurrency(values: PerCurrency, empty = "Nothing") {
  const parts = (["PKR", "USD"] as const).filter((c) => values[c] > 0).map((c) => (c === "PKR" ? `Rs ${values[c].toLocaleString("en-PK")}` : `$${values[c].toLocaleString("en-US")}`))
  return parts.length ? parts.join(" + ") : empty
}

export const percent = (ratio: number | null) => (ratio === null ? "–" : `${Math.round(ratio * 100)}%`)
