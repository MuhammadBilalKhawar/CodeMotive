import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getRenewal } from "@/lib/delivery/store"
import { deliveryOptions } from "@/lib/delivery/options"
import { RenewalForm } from "@/components/admin/delivery/renewal-form"
import { Card, PageHeader } from "@/components/admin/ui"

type Props = { params: Promise<{ id: string }> }

export const metadata = { title: "Renewal" }

export default async function RenewalPage({ params }: Props) {
  const renewal = await getRenewal((await params).id)
  if (!renewal) notFound()
  const options = await deliveryOptions()
  const { id, daysLeft: _days, createdAt: _c, updatedAt: _u, createdBy: _b, renewedAt: _r, ...input } = renewal

  return (
    <>
      <Link href="/admin/renewals" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Renewals
      </Link>
      <PageHeader title={renewal.name} />
      <Card className="max-w-4xl">
        <RenewalForm renewalId={id} initial={input} clients={options.clients} projects={options.projects} />
      </Card>
    </>
  )
}
