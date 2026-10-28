import { requireUser } from "@/lib/auth/current"
import { isDbConfigured } from "@/lib/db"
import { getBillingSettings } from "@/lib/billing/store"
import { BillingSettingsForm } from "@/components/admin/billing/settings-form"
import { Notice, PageHeader } from "@/components/admin/ui"

export const metadata = { title: "Billing settings" }

export default async function BillingSettingsPage() {
  await requireUser("owner")
  const settings = await getBillingSettings()
  return (
    <>
      <PageHeader title="Billing settings" description="What's printed on quotes and invoices, how clients pay, and payment reminders." />
      {!isDbConfigured() && (
        <div className="mb-6">
          <Notice tone="error">The database isn&apos;t connected, so these can&apos;t be saved yet.</Notice>
        </div>
      )}
      <BillingSettingsForm initial={settings} />
    </>
  )
}
