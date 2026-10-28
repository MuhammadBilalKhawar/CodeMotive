import { isDbConfigured } from "@/lib/db"
import { listVersions } from "@/lib/content"
import { VersionHistory } from "@/components/admin/version-history"
import { dateTimeFormat } from "@/components/admin/ui"
import { getPricing } from "@/lib/content"
import { PricingEditor } from "@/components/admin/pricing-editor"

export default async function AdminPricingPage() {
  const pricing = await getPricing()

  return (
    <>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-forest">Pricing</h1>
        <p className="text-charcoal/80 mt-1">
          Every price on the website and in the FAQs comes from here. Prices are shown as &quot;starting from&quot;.
        </p>
        {!isDbConfigured() && (
          <p role="alert" className="mt-4 rounded-xl bg-mint/40 border border-sage/40 px-4 py-3 text-sm text-forest">
            The database isn&apos;t connected, so changes can&apos;t be saved yet. Add MONGODB_URI to the environment variables.
          </p>
        )}
      </div>
      <PricingEditor initial={pricing} canSave={isDbConfigured()} />
      <div className="mt-8">
        <VersionHistory contentKey="pricing" versions={(await listVersions("pricing")).map((v) => ({ id: v.id, savedAt: dateTimeFormat.format(v.savedAt), savedBy: v.savedBy }))} />
      </div>
    </>
  )
}
