import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { listUsers } from "@/lib/auth/users"
import { getCurrentUser } from "@/lib/auth/current"
import { contactServiceOptions } from "@/data/services"
import { LeadForm } from "@/components/admin/crm/lead-form"
import { Card, PageHeader } from "@/components/admin/ui"

export const metadata = { title: "Add lead" }

// For enquiries that didn't come through the website: WhatsApp, Instagram, referrals.
export default async function NewLeadPage() {
  const [users, me] = await Promise.all([listUsers(), getCurrentUser()])
  return (
    <>
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Leads
      </Link>
      <PageHeader title="Add lead" description="For enquiries that came in on WhatsApp, Instagram, LinkedIn or through a referral." />
      <Card className="max-w-3xl">
        <LeadForm
          users={users.filter((u) => u.active).map((u) => ({ id: u.id, name: u.name }))}
          serviceOptions={contactServiceOptions.filter((s) => s !== "Not sure")}
          initial={{
            name: "",
            email: "",
            phone: "",
            business: "",
            service: "",
            source: "whatsapp",
            stage: "new",
            lostReason: "",
            value: null,
            ownerId: me?.id ?? "",
            followUpOn: "",
            tags: [],
          }}
        />
      </Card>
    </>
  )
}
