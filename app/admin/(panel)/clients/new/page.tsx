import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ClientForm } from "@/components/admin/crm/client-form"
import { Card, PageHeader } from "@/components/admin/ui"

export const metadata = { title: "Add client" }

export default function NewClientPage() {
  return (
    <>
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Clients
      </Link>
      <PageHeader title="Add client" description="For clients who didn't come through a lead, e.g. an existing customer." />
      <Card className="max-w-3xl">
        <ClientForm initial={{ name: "", business: "", email: "", phone: "", country: "Pakistan", currency: "PKR", address: "", status: "active", notes: "", tags: [] }} />
      </Card>
    </>
  )
}
