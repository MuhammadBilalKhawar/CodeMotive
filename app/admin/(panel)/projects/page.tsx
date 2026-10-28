import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { listProjects } from "@/lib/delivery/store"
import { listClients } from "@/lib/crm/clients"
import { listUsers } from "@/lib/auth/users"
import { activeProjectStages, projectStageLabels, projectStages, type ProjectStage } from "@/lib/delivery/schemas"
import { DeadlineBadge, ProjectStageBadge } from "@/components/admin/delivery/badges"
import { EmptyState, PageHeader, buttonClass } from "@/components/admin/ui"

export const metadata = { title: "Projects" }

type Props = { searchParams: Promise<{ stage?: string }> }

// Active work first (soonest deadline), then launched and on-hold projects.
export default async function ProjectsPage({ searchParams }: Props) {
  const { stage } = await searchParams
  const filter = stage === "all" ? "all" : projectStages.includes(stage as ProjectStage) ? (stage as ProjectStage) : "active"
  const [all, clients, users] = await Promise.all([listProjects(), listClients(), listUsers()])
  const clientName = new Map(clients.map((c) => [c.id, c.business || c.name]))
  const userName = new Map(users.map((u) => [u.id, u.name]))

  const projects = all
    .filter((p) => (filter === "all" ? true : filter === "active" ? activeProjectStages.includes(p.stage) : p.stage === filter))
    .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999))
  const count = (s: ProjectStage | "active" | "all") => (s === "all" ? all.length : s === "active" ? all.filter((p) => activeProjectStages.includes(p.stage)).length : all.filter((p) => p.stage === s).length)
  const tabs: [ProjectStage | "active" | "all", string][] = [["active", "In progress"], ...projectStages.map((s): [ProjectStage, string] => [s, projectStageLabels[s]]), ["all", "All"]]

  return (
    <>
      <PageHeader
        title="Projects"
        description="Client work from kick-off to handover: stage, deadline, checklist and links."
        actions={
          <Link href="/admin/projects/new" className={buttonClass.primary}>
            <Plus className="w-4 h-4" aria-hidden />
            New project
          </Link>
        }
      />

      <nav aria-label="Filter projects" className="mb-5 flex flex-wrap gap-1.5">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={key === "active" ? "/admin/projects" : `/admin/projects?stage=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={cn("rounded-full border px-3 py-1 text-sm font-semibold", filter === key ? "border-forest bg-forest text-neutral" : "border-sage/40 bg-white text-forest")}
          >
            {label} <span className="opacity-70">{count(key)}</span>
          </Link>
        ))}
      </nav>

      {projects.length === 0 ? (
        <EmptyState>{all.length ? "No projects here." : "No projects yet. Start one from an accepted quote, or with New project."}</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/projects/${p.id}`} className="block h-full rounded-2xl border border-sage/25 bg-white p-5 hover:border-forest/40 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <ProjectStageBadge stage={p.stage} />
                  <DeadlineBadge daysLeft={p.daysLeft} active={activeProjectStages.includes(p.stage)} />
                </div>
                <h2 className="font-heading font-bold text-lg text-forest">{p.name}</h2>
                <p className="text-sm text-charcoal/75">{clientName.get(p.clientId) ?? "Unknown client"}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-neutral overflow-hidden">
                    <div className="h-full bg-sage-600" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-forest">{p.progress}%</span>
                </div>
                <p className="mt-2 text-xs text-charcoal/65">
                  {p.dueDate ? `Deadline ${p.dueDate}` : "No deadline"}
                  {p.ownerId && userName.get(p.ownerId) ? ` · ${userName.get(p.ownerId)}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
