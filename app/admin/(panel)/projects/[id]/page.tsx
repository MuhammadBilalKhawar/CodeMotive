import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, PackageCheck, Trash2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/current"
import { listUsers } from "@/lib/auth/users"
import { getClient, listClients } from "@/lib/crm/clients"
import { listTimeline } from "@/lib/crm/timeline"
import { pakistanDate } from "@/lib/crm/schemas"
import { getQuote, listInvoices } from "@/lib/billing/store"
import { getProject, listRenewals } from "@/lib/delivery/store"
import { activeProjectStages, renewalKindLabels } from "@/lib/delivery/schemas"
import { deleteProjectAction } from "@/app/admin/actions/delivery"
import { ProjectForm } from "@/components/admin/delivery/project-form"
import { Checklist } from "@/components/admin/delivery/checklist"
import { Expenses } from "@/components/admin/delivery/expenses"
import { DeadlineBadge, ProjectStageBadge } from "@/components/admin/delivery/badges"
import { Timeline } from "@/components/admin/crm/timeline"
import { ActionButton } from "@/components/admin/billing/action-button"
import { Card, buttonClass, dateFormat, dateTimeFormat } from "@/components/admin/ui"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const project = await getProject((await params).id)
  return { title: project?.name ?? "Project" }
}

const linkLabels = { live: "Live site", staging: "Staging", jira: "Jira", repo: "Code", design: "Design" } as const

export default async function ProjectPage({ params }: Props) {
  const project = await getProject((await params).id)
  if (!project) notFound()
  const [me, users, clients, client, timeline, quote, renewals] = await Promise.all([
    getCurrentUser(),
    listUsers(),
    listClients(),
    getClient(project.clientId),
    listTimeline("project", project.id),
    project.quoteId ? getQuote(project.quoteId) : null,
    listRenewals({ projectId: project.id }),
  ])
  const owner = me?.role === "owner"
  // Money received on the quote's invoices (owners only).
  const invoices = owner && project.quoteId ? await listInvoices({ quoteId: project.quoteId }) : []
  const received = { PKR: 0, USD: 0 }
  for (const invoice of invoices) received[invoice.currency] += invoice.paid
  const links = (Object.keys(linkLabels) as (keyof typeof linkLabels)[]).filter((key) => project.links[key])

  return (
    <>
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Projects
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <ProjectStageBadge stage={project.stage} />
            <DeadlineBadge daysLeft={project.daysLeft} active={activeProjectStages.includes(project.stage)} />
            {project.launchedOn && <span className="text-sm text-charcoal/70">Launched {project.launchedOn}</span>}
          </div>
          <h1 className="font-heading font-bold text-3xl text-forest">{project.name}</h1>
          <p className="text-charcoal/80 mt-1">
            {client ? (
              <Link href={`/admin/clients/${client.id}`} className="underline underline-offset-2">
                {client.business || client.name}
              </Link>
            ) : (
              "Unknown client"
            )}
            {quote && (
              <>
                {" · "}
                <Link href={`/admin/quotes/${quote.id}`} className="underline underline-offset-2">
                  quote {quote.number}
                </Link>
              </>
            )}
            {project.dueDate && ` · deadline ${project.dueDate}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((key) => (
            <a key={key} href={project.links[key]} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
              <ExternalLink className="w-4 h-4" aria-hidden />
              {linkLabels[key]}
            </a>
          ))}
          <Link href={`/admin/handover/${project.id}`} className={buttonClass.primary}>
            <PackageCheck className="w-4 h-4" aria-hidden />
            Handover pack
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Card title="Checklist">
            <Checklist
              projectId={project.id}
              items={project.checklist.map((i) => ({ id: i.id, text: i.text, done: i.done, doneBy: i.doneBy, doneAt: i.doneAt ? dateFormat.format(i.doneAt) : undefined }))}
            />
          </Card>
          <Card title="Details">
            <ProjectForm
              projectId={project.id}
              clients={clients.map((c) => ({ id: c.id, name: c.business || c.name }))}
              users={users.filter((u) => u.active || u.id === project.ownerId).map((u) => ({ id: u.id, name: u.name }))}
              initial={{
                name: project.name,
                clientId: project.clientId,
                quoteId: project.quoteId,
                kind: project.kind,
                stage: project.stage,
                ownerId: project.ownerId,
                startDate: project.startDate,
                dueDate: project.dueDate,
                links: project.links,
                notes: project.notes,
                handoverNotes: project.handoverNotes,
              }}
            />
          </Card>
          {owner && (
            <Card title="Costs" description="What the project cost you, against the money received on its quote.">
              <Expenses
                projectId={project.id}
                expenses={project.expenses.map(({ id, date, description, category, amount, currency }) => ({ id, date, description, category, amount, currency }))}
                received={received}
                currency={quote?.currency ?? client?.currency ?? "PKR"}
                today={pakistanDate()}
              />
            </Card>
          )}
          {owner && (
            <div className="flex justify-end">
              <ActionButton variant="danger" label="Delete project" icon={<Trash2 className="w-4 h-4" aria-hidden />} run={deleteProjectAction.bind(null, project.id)} confirm={`Delete ${project.name}, its checklist, costs and timeline?`} then="/admin/projects" />
            </div>
          )}
        </div>

        <div className="space-y-6 min-w-0">
          <Card title="Renewals" description="Domain, hosting and other things that renew for this project.">
            {renewals.length === 0 ? (
              <p className="text-sm text-charcoal/70">None yet.</p>
            ) : (
              <ul className="divide-y divide-sage/15 text-sm">
                {renewals.map((r) => (
                  <li key={r.id} className="py-2 flex flex-wrap justify-between gap-2">
                    <span>
                      <span className="font-semibold text-forest">{r.name}</span> · {renewalKindLabels[r.kind]}
                    </span>
                    <span className={r.daysLeft < 0 ? "font-semibold text-red-700" : ""}>{r.renewsOn}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/admin/renewals?clientId=${project.clientId}&projectId=${project.id}#add`} className={`${buttonClass.quiet} mt-3`}>
              Add a renewal
            </Link>
          </Card>
          <Card title="Timeline">
            <Timeline subject="project" subjectId={project.id} items={timeline.map((t) => ({ id: t.id, type: t.type, text: t.text, by: t.by, at: dateTimeFormat.format(t.at) }))} />
          </Card>
        </div>
      </div>
    </>
  )
}
