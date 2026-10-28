import { redirect } from "next/navigation"
import { AuthCard } from "@/components/admin/auth-card"
import { SetupForm } from "@/components/admin/login-form"
import { countUsers } from "@/lib/auth/users"
import { isDbConfigured } from "@/lib/db"

// First-run only: creates the first owner account.
export default async function AdminSetupPage() {
  if (!isDbConfigured()) {
    return (
      <AuthCard title="Admin setup" subtitle="Connect the database first.">
        <p className="text-sm text-mint">Add MONGODB_URI to your environment variables, restart, then come back here.</p>
      </AuthCard>
    )
  }
  if ((await countUsers()) > 0) redirect("/admin/login")
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <AuthCard title="Admin setup" subtitle="One more environment variable.">
        <p className="text-sm text-mint">Set ADMIN_PASSWORD (used once, to prove you own the site), restart, then come back here.</p>
      </AuthCard>
    )
  }
  return (
    <AuthCard title="Create the owner account" subtitle="You'll add Ahmad from Settings → Team afterwards.">
      <SetupForm />
    </AuthCard>
  )
}
