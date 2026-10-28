"use client"

import { useEffect, useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// Single-series charts for the admin reports. One brand colour per chart
// (identity comes from the title), thin marks with 4px rounded data-ends,
// hairline grid, labels only on the highest and latest values, a tooltip on
// hover and keyboard focus, and a table view so no value hides behind hover.

export type Point = { label: string; value: number }
export type ValueFormat = "count" | "PKR" | "USD"

const vizStyle = {
  // Brand green stepped for charts (validated: lightness band, chroma, contrast on white).
  "--viz-mark": "#2b8a5e",
  "--viz-mark-hover": "#1f6b48",
  "--viz-grid": "#e4e2da",
  "--viz-axis": "#c9c7bd",
  "--viz-muted": "#7a7870",
} as React.CSSProperties

export function formatValue(value: number, format: ValueFormat, compact = false) {
  const n = compact ? compactNumber(value) : value.toLocaleString("en-US")
  return format === "PKR" ? `Rs ${n}` : format === "USD" ? `$${n}` : n
}

function compactNumber(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${+(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `${+(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`
  return String(value)
}

// 0 and up to 4 clean steps above the largest value.
function ticks(max: number) {
  if (max <= 0) return [0, 1]
  const rough = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(6))
}

function TableView({ data, format, labelHeader }: { data: Point[]; format: ValueFormat; labelHeader: string }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-xs font-semibold text-sage-600 w-fit">Show as a table</summary>
      <table className="mt-2 w-full max-w-sm">
        <thead>
          <tr className="text-left text-xs text-charcoal/70">
            <th className="py-1 font-semibold">{labelHeader}</th>
            <th className="py-1 font-semibold text-right">Value</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {data.map((d) => (
            <tr key={d.label} className="border-t border-sage/15">
              <td className="py-1">{d.label}</td>
              <td className="py-1 text-right">{formatValue(d.value, format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

// Vertical columns over time (months).
export function ColumnChart({ data, format, title, height = 180 }: { data: Point[]; format: ValueFormat; title: string; height?: number }) {
  const [active, setActive] = useState<number | null>(null)
  const id = useId()
  // Drawn at the real width, so text stays 11px on phones instead of shrinking.
  const figure = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const el = figure.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const left = 44
  const right = 8
  const top = 22
  const bottom = 26
  const plotH = height - top - bottom
  const scale = ticks(Math.max(...data.map((d) => d.value), 0))
  const maxTick = scale[scale.length - 1]
  const band = (width - left - right) / data.length
  const barW = Math.min(24, band * 0.6)
  const y = (v: number) => top + plotH - (v / maxTick) * plotH
  const maxIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)
  const labelled = new Set([maxIndex, data.length - 1].filter((i) => data[i]?.value > 0))
  const empty = data.every((d) => d.value === 0)
  // Every other month label when the columns are narrow (the latest always shows).
  const labelEvery = band < 44 ? 2 : 1

  return (
    <figure ref={figure} style={vizStyle} className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-labelledby={`${id}-t`}>
        <title id={`${id}-t`}>{`${title}: ${data.map((d) => `${d.label} ${formatValue(d.value, format)}`).join(", ")}`}</title>
        {scale.map((t) => (
          <g key={t}>
            <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} strokeWidth={1} />
            <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--viz-muted)" className="tabular-nums">
              {formatValue(t, format, true)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = left + band * i + band / 2
          const h = Math.max(0, y(0) - y(d.value))
          const x = cx - barW / 2
          const r = Math.min(4, h)
          // Rounded at the data end, square at the baseline.
          const path = h > 0 ? `M${x},${y(0)} V${y(d.value) + r} Q${x},${y(d.value)} ${x + r},${y(d.value)} H${x + barW - r} Q${x + barW},${y(d.value)} ${x + barW},${y(d.value) + r} V${y(0)} Z` : ""
          return (
            <g
              key={d.label}
              tabIndex={0}
              role="img"
              aria-label={`${d.label}: ${formatValue(d.value, format)}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="outline-none focus-visible:[&>rect]:stroke-[var(--viz-mark)]"
            >
              {/* Hit area: the whole band, bigger than the mark. */}
              <rect x={left + band * i} y={top} width={band} height={plotH} fill="transparent" stroke="transparent" strokeWidth={2} rx={4} />
              {path && <path d={path} fill={active === i ? "var(--viz-mark-hover)" : "var(--viz-mark)"} />}
              {labelled.has(i) && active === null && (
                <text x={cx} y={y(d.value) - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1e1e1e">
                  {formatValue(d.value, format, true)}
                </text>
              )}
              {(data.length - 1 - i) % labelEvery === 0 && (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--viz-muted)">
                  {d.label}
                </text>
              )}
            </g>
          )
        })}
        {empty && (
          <text x={(left + width) / 2} y={top + plotH / 2} textAnchor="middle" fontSize={13} fill="var(--viz-muted)">
            Nothing yet
          </text>
        )}
      </svg>
      {active !== null && data[active] && (
        <div
          role="status"
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-white border border-sage/30 shadow-lift px-3 py-2 text-xs whitespace-nowrap"
          style={{ left: `${((left + band * active + band / 2) / width) * 100}%`, top: 0 }}
        >
          <p className="text-sm font-semibold text-charcoal">{formatValue(data[active].value, format)}</p>
          <p className="text-charcoal/70">{data[active].label}</p>
        </div>
      )}
      <TableView data={data} format={format} labelHeader="Month" />
    </figure>
  )
}

// Horizontal bars for categories (sources, topics), longest first.
export function BarList({ data, format = "count", notes, labelHeader = "Category" }: { data: Point[]; format?: ValueFormat; notes?: Record<string, string>; labelHeader?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  if (data.length === 0) return <p className="text-sm text-charcoal/70">Nothing in this period.</p>
  return (
    <div style={vizStyle}>
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.label} className="group" tabIndex={0} aria-label={`${d.label}: ${formatValue(d.value, format)}${notes?.[d.label] ? `, ${notes[d.label]}` : ""}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
              <span className="text-charcoal">{d.label}</span>
              <span className="text-xs text-charcoal/70">{notes?.[d.label]}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div
                  className={cn("h-3 rounded-r-[4px] transition-colors bg-[var(--viz-mark)] group-hover:bg-[var(--viz-mark-hover)] group-focus-visible:bg-[var(--viz-mark-hover)]")}
                  style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
                />
              </div>
              <span className="w-16 text-right text-sm font-semibold text-charcoal tabular-nums">{formatValue(d.value, format, true)}</span>
            </div>
          </li>
        ))}
      </ul>
      <TableView data={data} format={format} labelHeader={labelHeader} />
    </div>
  )
}
