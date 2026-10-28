import { AuthCard } from "@/components/admin/auth-card"
import { TwoFactorForm } from "@/components/admin/login-form"

export default async function TwoFactorPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <AuthCard title="Two-factor check" subtitle="Enter the 6-digit code from your authenticator app.">
      <TwoFactorForm next={next ?? ""} />
    </AuthCard>
  )
}
