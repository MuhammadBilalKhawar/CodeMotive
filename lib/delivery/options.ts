import { getPricing } from "@/lib/content"
import { listClients } from "@/lib/crm/clients"
import { listProjects } from "@/lib/delivery/store"
import { carePlanIds } from "@/data/pricing"

// Choices for the care plan and renewal forms.
export async function deliveryOptions() {
  const [clients, projects, { packages }] = await Promise.all([listClients(), listProjects(), getPricing()])
  return {
    clients: clients.map((c) => ({ id: c.id, name: c.business || c.name, currency: c.currency })),
    projects: projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId })),
    packages: packages.filter((p) => carePlanIds.includes(p.id) || p.unit === "monthly").map((p) => ({ id: p.id, name: p.name, features: p.features, priceFrom: p.priceFrom })),
  }
}
