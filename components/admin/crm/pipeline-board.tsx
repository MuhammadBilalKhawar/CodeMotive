"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { setLeadStageAction } from "@/app/admin/actions/crm"
import { formatMoney, sourceLabels, stageLabels, stages, type Money, type Source, type Stage } from "@/lib/crm/schemas"
import { FollowUpBadge } from "@/components/admin/crm/badges"
import { Notice } from "@/components/admin/ui"

export type BoardLead = {
  id: string
  name: string
  business: string
  service: string
  source: Source
  stage: Stage
  value: Money
  followUpOn: string
  // Initials of the admin user responsible.
  owner: string
  createdAt: string
  isClient: boolean
}

// Won and lost pile up; the board shows the most recent ones.
const CLOSED_LIMIT = 12

const age = (iso: string) => {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000)
  return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`
}

// Drag a card to another column to change its stage (or use "Move to" on phones).
export function PipelineBoard({ initial, today }: { initial: BoardLead[]; today: string }) {
  const router = useRouter()
  const [leads, setLeads] = useState(initial)
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const move = (id: string, stage: Stage) => {
    const lead = leads.find((l) => l.id === id)
    if (!lead || lead.stage === stage) return
    let reason = ""
    if (stage === "lost") {
      const answer = window.prompt(`Why was ${lead.name} lost? (optional)`, "")
      if (answer === null) return
      reason = answer
    }
    const before = leads
    setLeads((list) => list.map((l) => (l.id === id ? { ...l, stage } : l)))
    setError(null)
    startTransition(async () => {
      const result = await setLeadStageAction(id, stage, reason)
      if (!result.ok) {
        setLeads(before)
        setError(result.error)
      } else router.refresh()
    })
  }

  return (
    <div>
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      {/* relative: keeps the cards' screen-reader labels inside the scroll area on phones. */}
      <div className="relative -mx-4 sm:mx-0 overflow-x-auto pb-2">
        <div className="grid grid-flow-col auto-cols-[minmax(250px,1fr)] gap-4 px-4 sm:px-0 min-w-max xl:min-w-0 xl:grid-flow-row xl:grid-cols-5">
          {stages.map((stage) => {
            const all = leads.filter((l) => l.stage === stage)
            const closed = stage === "won" || stage === "lost"
            const shown = closed ? all.slice(0, CLOSED_LIMIT) : all
            const total = all.reduce<Record<string, number>>((sum, l) => {
              if (l.value) sum[l.value.currency] = (sum[l.value.currency] ?? 0) + l.value.amount
              return sum
            }, {})
            return (
              <section
                key={stage}
                aria-label={stageLabels[stage]}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOver(stage)
                }}
                onDragLeave={() => setOver((s) => (s === stage ? null : s))}
                onDrop={(e) => {
                  e.preventDefault()
                  setOver(null)
                  const id = e.dataTransfer.getData("text/plain")
                  if (id) move(id, stage)
                }}
                className={cn("rounded-2xl bg-white/60 border border-sage/25 p-3 flex flex-col min-h-[200px] transition-colors", over === stage && dragging && "bg-mint/40 border-forest")}
              >
                <header className="px-1 pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-bold text-forest">{stageLabels[stage]}</h2>
                    <span className="rounded-full bg-neutral px-2 py-0.5 text-xs font-semibold text-charcoal/80">{all.length}</span>
                  </div>
                  {Object.keys(total).length > 0 && (
                    <p className="text-xs text-sage-600 font-medium mt-0.5">
                      {Object.entries(total)
                        .map(([currency, amount]) => formatMoney({ amount, currency: currency as "PKR" | "USD" }))
                        .join(" + ")}
                    </p>
                  )}
                </header>
                <ul className="space-y-2.5 flex-1">
                  {shown.map((lead) => (
                    <li key={lead.id}>
                      <article
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", lead.id)
                          e.dataTransfer.effectAllowed = "move"
                          setDragging(lead.id)
                        }}
                        onDragEnd={() => setDragging(null)}
                        className={cn("rounded-xl bg-white border border-sage/25 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-forest/40", dragging === lead.id && "opacity-50")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-forest leading-snug hover:underline underline-offset-2">
                            {lead.name}
                          </Link>
                          {lead.owner && (
                            <span title="Owner" className="shrink-0 w-6 h-6 rounded-full bg-forest text-mint text-[0.6rem] font-bold flex items-center justify-center">
                              {lead.owner}
                            </span>
                          )}
                        </div>
                        {lead.business && (
                          <p className="text-xs text-charcoal/80 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 shrink-0" aria-hidden />
                            <span className="truncate">{lead.business}</span>
                          </p>
                        )}
                        {lead.service && <p className="text-xs text-charcoal/70 mt-0.5 truncate">{lead.service}</p>}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {lead.value && <span className="text-xs font-semibold text-forest">{formatMoney(lead.value)}</span>}
                          <FollowUpBadge date={stage === "won" || stage === "lost" ? "" : lead.followUpOn} today={today} />
                          {lead.isClient && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-mint/60 px-2 py-0.5 text-[0.7rem] font-semibold text-forest">
                              <UserRound className="w-3 h-3" aria-hidden />
                              Client
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2 text-[0.7rem] text-charcoal/60">
                          <span className="truncate">
                            {sourceLabels[lead.source]} · {age(lead.createdAt)}
                          </span>
                          <label className="shrink-0">
                            <span className="sr-only">Move {lead.name} to</span>
                            <select
                              value={lead.stage}
                              onChange={(e) => move(lead.id, e.target.value as Stage)}
                              className="rounded-md border border-sage/30 bg-white px-1 py-0.5 text-[0.7rem] text-charcoal"
                            >
                              {stages.map((s) => (
                                <option key={s} value={s}>
                                  {stageLabels[s]}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
                {closed && all.length > CLOSED_LIMIT && (
                  <Link href={`/admin/leads?view=list&stage=${stage}`} className="mt-3 px-1 text-xs font-semibold text-forest hover:underline">
                    +{all.length - CLOSED_LIMIT} more
                  </Link>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
