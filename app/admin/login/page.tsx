import Link from "next/link"
import { AuthCard } from "@/components/admin/auth-card"
import { LoginForm } from "@/components/admin/login-form"
import { countUsers } from "@/lib/auth/users"
import { isDbConfigured } from "@/lib/db"

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const needsSetup = isDbConfigured() && (await countUsers()) === 0

  return (
    <AuthCard title="Admin sign in" subtitle="Website, leads, quotes and invoices.">
      {needsSetup ? (
        <p className="text-sm text-mint">
          No admin accounts exist yet.{" "}
          <Link href="/admin/setup" className="font-semibold text-white underline underline-offset-4">
            Create the first owner account
          </Link>
          .
        </p>
      ) : (
        <LoginForm next={next ?? ""} />
      )}
    </AuthCard>
  )
}
