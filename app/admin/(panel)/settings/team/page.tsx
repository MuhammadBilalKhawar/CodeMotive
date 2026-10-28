import { requireUser } from "@/lib/auth/current"
import { listUsers } from "@/lib/auth/users"
import { Card, PageHeader, dateTimeFormat } from "@/components/admin/ui"
import { AddMemberForm, TeamTable } from "@/components/admin/team-manager"

export default async function TeamPage() {
  const user = await requireUser("owner")
  const members = (await listUsers()).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    active: m.active,
    totpEnabled: m.totpEnabled,
    lastLogin: m.lastLoginAt ? dateTimeFormat.format(m.lastLoginAt) : null,
  }))

  return (
    <>
      <PageHeader title="Team" description="Who can sign in to the admin. Owners can do everything; team members can't see money pages or manage the team." />
      <div className="space-y-6">
        <TeamTable members={members} currentUserId={user.id} />
        <Card title="Add an account" description="They sign in at /admin/login with this email and the temporary password, then change it in My account.">
          <AddMemberForm />
        </Card>
      </div>
    </>
  )
}
