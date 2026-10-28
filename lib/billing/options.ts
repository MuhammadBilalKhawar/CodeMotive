import { getPricing } from "@/lib/content"
import { listClients } from "@/lib/crm/clients"
import type { ClientOption, PackageOption } from "@/components/admin/billing/document-editor"

// Choices for the quote and invoice editor: your packages (live prices) and active clients.
export async function editorOptions() {
  const [{ packages }, clients] = await Promise.all([getPricing(), listClients({ status: "active" })])
  return {
    packages: packages.map((p): PackageOption => ({ id: p.id, name: p.name, features: p.features, priceFrom: p.priceFrom, unit: p.unit })),
    clients: clients.map((c): ClientOption => ({ id: c.id, name: c.name, business: c.business, email: c.email, address: c.address, currency: c.currency })),
  }
}
