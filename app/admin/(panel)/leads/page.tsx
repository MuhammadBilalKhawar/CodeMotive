import Link from "next/link"
import { CalendarClock, KanbanSquare, List, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { isDbConfigured } from "@/lib/db"
import { dueFollowUps, listLeads, type Lead } from "@/lib/leads"
import { listUsers } from "@/lib/auth/users"
import { lastContactByLead } from "@/lib/crm/timeline"
import { formatMoney, pakistanDate, sourceLabels, sources, stageLabels, stages, type Source, type Stage } from "@/lib/crm/schemas"
import { PipelineBoard, type BoardLead } from "@/components/admin/crm/pipeline-board"
import { FollowUpBadge, StageBadge, initials } from "@/components/admin/crm/badges"
import { EmptyState, Notice, PageHeader, buttonClass, dateFormat } from "@/components/admin/ui"
import { inputClass } from "@/components/admin/fields"

export const metadata = { title: "Leads" }

type Props = { searchParams: Promise<Record<string, string | undefined>> }

const pick = <T extends string>(list: readonly T[], value?: string) => (list.includes(value as T) ? (value as T) : undefined)

export default async function AdminLeadsPage({ searchParams }: Props) {
  const params = await searchParams
  const view = params.view === "list" ? "list" : "board"
  const filter = {
    q: params.q?.slice(0, 80),
    stage: pick(stages, params.stage) as Stage | undefined,
    source: pick(sources, params.source) as Source | undefined,
    ownerId: params.owner || undefined,
  }
  const today = pakistanDate()

  let leads: Lead[] = []
  let due: Lead[] = []
  let users: { id: string; name: string }[] = []
  let loadError = false
  try {
    ;[leads, due, users] = await Promise.all([
      // The board shows every stage, so only the search and source/owner filters apply.
      listLeads(view === "board" ? { ...filter, stage: undefined } : filter),
      dueFollowUps(today),
      listUsers().then((list) => list.map((u) => ({ id: u.id, name: u.name }))),
    ])
  } catch (error) {
    console.error("Admin leads could not be loaded", error)
    loadError = true
  }
  const ownerInitials = new Map(users.map((u) => [u.id, initials(u.name)]))
  const ownerName = new Map(users.map((u) => [u.id, u.name]))
  const filtered = Boolean(filter.q || filter.stage || filter.source || filter.ownerId)

  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries({ view, q: filter.q, stage: filter.stage, source: filter.source, owner: filter.ownerId, ...patch })) {
      if (value && !(key === "view" && value === "board")) next.set(key, value)
    }
    const qs = next.toString()
    return `/admin/leads${qs ? `?${qs}` : ""}`
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every enquiry from the website plus the ones you add by hand. Drag a card to change its stage; open it to log calls and set a follow-up."
        actions={
          <Link href="/admin/leads/new" className={buttonClass.primary}>
            <Plus className="w-4 h-4" aria-hidden />
            Add lead
          </Link>
        }
      />

      {(!isDbConfigured() || loadError) && (
        <div className="mb-6">
          <Notice tone="error">{loadError ? "Couldn't reach the database." : "The database isn't connected, so leads aren't being stored."}</Notice>
        </div>
      )}

      {due.length > 0 && (
        <section aria-labelledby="due-heading" className="mb-8 rounded-2xl border border-forest/30 bg-white p-5">
          <h2 id="due-heading" className="font-heading font-bold text-lg text-forest flex items-center gap-2">
            <CalendarClock className="w-5 h-5" aria-hidden />
            Follow up today ({due.length})
          </h2>
          <ul className="mt-3 divide-y divide-sage/15">
            {due.slice(0, 8).map((lead) => (
              <li key={lead.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                  {lead.name}
                </Link>
                {lead.business && <span className="text-sm text-charcoal/75">{lead.business}</span>}
                <StageBadge stage={lead.stage} />
                <span className="sm:ml-auto flex items-center gap-2">
                  {lead.ownerId && <span className="text-xs text-charcoal/70">{ownerName.get(lead.ownerId)}</span>}
                  <FollowUpBadge date={lead.followUpOn} today={today} />
                </span>
              </li>
            ))}
          </ul>
          {due.length > 8 && <p className="text-sm text-charcoal/70 mt-2">And {due.length - 8} more.</p>}
        </section>
      )}

      <div className="mb-5 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="inline-flex rounded-lg border border-sage/40 bg-white p-1 w-fit" role="group" aria-label="View">
          <Link href={link({ view: "board", stage: undefined })} aria-current={view === "board" ? "page" : undefined} className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold", view === "board" ? "bg-forest text-neutral" : "text-forest")}>
            <KanbanSquare className="w-4 h-4" aria-hidden />
            Board
          </Link>
          <Link href={link({ view: "list" })} aria-current={view === "list" ? "page" : undefined} className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold", view === "list" ? "bg-forest text-neutral" : "text-forest")}>
            <List className="w-4 h-4" aria-hidden />
            List
          </Link>
        </div>

        <form action="/admin/leads" className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {view === "list" && <input type="hidden" name="view" value="list" />}
          <label className="relative">
            <span className="sr-only">Search leads</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50" aria-hidden />
            <input name="q" defaultValue={filter.q} placeholder="Search name, phone, email" className={cn(inputClass, "pl-9 w-64")} />
          </label>
          {view === "list" && (
            <select name="stage" defaultValue={filter.stage ?? ""} aria-label="Stage" className={cn(inputClass, "w-auto")}>
              <option value="">All stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {stageLabels[s]}
                </option>
              ))}
            </select>
          )}
          <select name="source" defaultValue={filter.source ?? ""} aria-label="Source" className={cn(inputClass, "w-auto")}>
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {sourceLabels[s]}
              </option>
            ))}
          </select>
          {users.length > 1 && (
            <select name="owner" defaultValue={filter.ownerId ?? ""} aria-label="Owner" className={cn(inputClass, "w-auto")}>
              <option value="">Everyone</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
          <button type="submit" className={buttonClass.secondary}>
            Filter
          </button>
          {filtered && (
            <Link href={link({ q: undefined, stage: undefined, source: undefined, owner: undefined })} className={buttonClass.quiet}>
              Clear
            </Link>
          )}
        </form>
      </div>

      {leads.length === 0 ? (
        <EmptyState>{filtered ? "No leads match these filters." : "No leads yet. They appear here when someone uses the contact or mockup form, or when you add one."}</EmptyState>
      ) : view === "board" ? (
        <PipelineBoard
          key={leads.map((l) => `${l.id}:${l.stage}`).join(",")}
          today={today}
          initial={leads.map(
            (l): BoardLead => ({
              id: l.id,
              name: l.name,
              business: l.business,
              service: l.service,
              source: l.source,
              stage: l.stage,
              value: l.value,
              followUpOn: l.followUpOn,
              owner: ownerInitials.get(l.ownerId) ?? "",
              createdAt: l.createdAt.toISOString(),
              isClient: Boolean(l.clientId),
            }),
          )}
        />
      ) : (
        <LeadTable leads={leads} today={today} ownerName={ownerName} />
      )}
    </>
  )
}

async function LeadTable({ leads, today, ownerName }: { leads: Lead[]; today: string; ownerName: Map<string, string> }) {
  const lastContact = await lastContactByLead(leads.map((l) => l.id))
  return (
    <div className="overflow-x-auto rounded-2xl border border-sage/25 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral/70 text-left text-xs uppercase tracking-wider text-sage-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Lead</th>
            <th className="px-4 py-3 font-semibold">Stage</th>
            <th className="px-4 py-3 font-semibold">Service</th>
            <th className="px-4 py-3 font-semibold">Value</th>
            <th className="px-4 py-3 font-semibold">Follow-up</th>
            <th className="px-4 py-3 font-semibold">Owner</th>
            <th className="px-4 py-3 font-semibold">Received</th>
            <th className="px-4 py-3 font-semibold">Last contact</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sage/15">
          {leads.map((lead) => {
            const contacted = lastContact.get(lead.id)
            return (
              <tr key={lead.id} className="hover:bg-neutral/40">
                <td className="px-4 py-3 min-w-[200px]">
                  <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-forest hover:underline underline-offset-2">
                    {lead.name}
                  </Link>
                  <span className="block text-xs text-charcoal/70">{[lead.business, sourceLabels[lead.source]].filter(Boolean).join(" · ")}</span>
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={lead.stage} />
                </td>
                <td className="px-4 py-3 text-charcoal/85 min-w-[140px]">{lead.service || "–"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{lead.value ? formatMoney(lead.value) : "–"}</td>
                <td className="px-4 py-3">{lead.followUpOn && (lead.stage === "won" || lead.stage === "lost") ? lead.followUpOn : <FollowUpBadge date={lead.followUpOn} today={today} />}</td>
                <td className="px-4 py-3 whitespace-nowrap">{ownerName.get(lead.ownerId) ?? "–"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{dateFormat.format(lead.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{contacted ? dateFormat.format(contacted) : "Not yet"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
