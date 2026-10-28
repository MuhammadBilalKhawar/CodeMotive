import Link from "next/link"
import { listActivity } from "@/lib/audit"
import { cn } from "@/lib/utils"
import { EmptyState, PageHeader, dateTimeFormat } from "@/components/admin/ui"

const filters = [
  { value: "", label: "Everything" },
  { value: "account", label: "Sign-ins" },
  { value: "pricing", label: "Pricing" },
  { value: "projects", label: "Portfolio" },
  { value: "lead", label: "Leads" },
  { value: "team", label: "Team" },
]

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ entity?: string }> }) {
  const { entity = "" } = await searchParams
  const entries = await listActivity({ entity: entity || undefined })

  return (
    <>
      <PageHeader title="Activity log" description="Who changed what, and when (Pakistan time). The latest 200 entries." />
      <nav aria-label="Filter activity" className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/activity?entity=${f.value}` : "/admin/activity"}
            aria-current={entity === f.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold",
              entity === f.value ? "bg-forest text-neutral border-forest" : "bg-white text-forest border-sage/40 hover:border-forest",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {entries.length === 0 ? (
        <EmptyState>Nothing here yet.</EmptyState>
      ) : (
        <ol className="rounded-2xl border border-sage/25 bg-white divide-y divide-sage/15">
          {entries.map((e) => (
            <li key={e.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
              <time className="text-charcoal/70 sm:w-44 shrink-0" dateTime={e.at.toISOString()}>
                {dateTimeFormat.format(e.at)}
              </time>
              <span className="text-forest">{e.summary}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
