import Link from "next/link"
import { requireUser } from "@/lib/auth/current"
import { Card, Notice, PageHeader, dateTimeFormat } from "@/components/admin/ui"
import { ChangePasswordForm, SignOutOthersButton, TwoFactorPanel } from "@/components/admin/account-forms"

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser()
  const { welcome } = await searchParams

  return (
    <>
      <PageHeader title="My account" description={`${user.name} · ${user.email} · ${user.role === "owner" ? "Owner" : "Team member"}`} />
      <div className="space-y-6">
        {welcome && (
          <Notice tone="success">
            Your owner account is ready. Next: turn on two-factor sign-in below, then{" "}
            <Link href="/admin/settings/team" className="font-semibold underline underline-offset-4">
              add Ahmad in Team
            </Link>
            . ADMIN_PASSWORD is no longer used for signing in.
          </Notice>
        )}
        <Card title="Two-factor sign-in" description="A code from an authenticator app on your phone, as well as your password.">
          <TwoFactorPanel enabled={user.totpEnabled} />
        </Card>
        <Card title="Password">
          <ChangePasswordForm />
        </Card>
        <Card title="Devices" description={user.lastLoginAt ? `Last sign-in: ${dateTimeFormat.format(user.lastLoginAt)} (Pakistan time)` : undefined}>
          <SignOutOthersButton />
        </Card>
      </div>
    </>
  )
}
