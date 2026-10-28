import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/current"
import { listUsers } from "@/lib/auth/users"
import { listClients } from "@/lib/crm/clients"
import { pakistanDate } from "@/lib/crm/schemas"
import { ProjectForm } from "@/components/admin/delivery/project-form"
import { Card, EmptyState, PageHeader } from "@/components/admin/ui"

export const metadata = { title: "New project" }

type Props = { searchParams: Promise<{ clientId?: string }> }

export default async function NewProjectPage({ searchParams }: Props) {
  const { clientId } = await searchParams
  const [clients, users, me] = await Promise.all([listClients(), listUsers(), getCurrentUser()])

  return (
    <>
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Projects
      </Link>
      <PageHeader title="New project" description="Tip: on an accepted quote, “Start project” fills this in for you." />
      {clients.length === 0 ? (
        <EmptyState>Projects belong to a client. Add a client first, or win a lead.</EmptyState>
      ) : (
        <Card className="max-w-3xl">
          <ProjectForm
            clients={clients.map((c) => ({ id: c.id, name: c.business || c.name }))}
            users={users.filter((u) => u.active).map((u) => ({ id: u.id, name: u.name }))}
            initial={{
              name: "",
              clientId: clients.some((c) => c.id === clientId) ? clientId! : "",
              quoteId: "",
              kind: "website",
              stage: "planning",
              ownerId: me?.id ?? "",
              startDate: pakistanDate(),
              dueDate: "",
              links: { live: "", staging: "", jira: "", repo: "", design: "" },
              notes: "",
              handoverNotes: "",
            }}
          />
        </Card>
      )}
    </>
  )
}
