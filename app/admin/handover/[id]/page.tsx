import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { requireUser } from "@/lib/auth/current"
import { getClient } from "@/lib/crm/clients"
import { getQuote } from "@/lib/billing/store"
import { getProject, listCarePlans, listRenewals } from "@/lib/delivery/store"
import { renewalKindLabels } from "@/lib/delivery/schemas"
import { longDate, money } from "@/lib/billing/schemas"
import { pakistanDate } from "@/lib/crm/schemas"
import { getSite } from "@/lib/cms"
import { PrintButton } from "@/components/admin/delivery/print-button"

type Props = { params: Promise<{ id: string }> }

export const metadata = { title: "Handover pack" }

const lines = (text: string) => text.split("\n").filter((line) => line.trim())

// One printable page for the client at launch: what was built, their links,
// what renews and when, the care plan, and how to reach us. No passwords.
export default async function HandoverPage({ params }: Props) {
  await requireUser()
  const project = await getProject((await params).id)
  if (!project) notFound()
  const [client, quote, renewals, plans, site] = await Promise.all([
    getClient(project.clientId),
    project.quoteId ? getQuote(project.quoteId) : null,
    listRenewals({ clientId: project.clientId }),
    listCarePlans({ clientId: project.clientId, status: "active" }),
    getSite(),
  ])
  const relevant = renewals.filter((r) => !r.projectId || r.projectId === project.id)

  return (
    <main className="min-h-screen bg-neutral print:bg-white px-4 py-8 print:p-0">
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/projects/${project.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to the project
        </Link>
        <PrintButton />
      </div>

      <article className="max-w-3xl mx-auto rounded-3xl bg-white border border-sage/25 p-8 sm:p-12 print:border-0 print:rounded-none print:p-0 text-charcoal">
        <header className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b-2 border-forest">
          <Image src="/brand/header-logo-light-mode.svg" alt="CodeMotive" width={180} height={40} className="h-9 w-auto" />
          <div className="text-right">
            <p className="font-heading font-bold text-2xl text-forest">Handover pack</p>
            <p className="text-sm text-sage-600">{longDate(project.launchedOn || pakistanDate())}</p>
          </div>
        </header>

        <h1 className="font-heading font-bold text-3xl text-forest mt-8">{project.name}</h1>
        <p className="text-charcoal/80 mt-1">Prepared for {client ? client.business || client.name : "you"}</p>

        <Section title="Your website">
          {project.links.live ? (
            <p>
              Live at{" "}
              <a href={project.links.live} className="font-semibold text-forest underline underline-offset-2 break-all">
                {project.links.live}
              </a>
            </p>
          ) : (
            <p>Your website address will be added here at launch.</p>
          )}
        </Section>

        {quote && (
          <Section title="What we built">
            <ul className="space-y-2">
              {quote.items.map((item, i) => (
                <li key={i}>
                  <p className="font-semibold">{item.description}</p>
                  {item.details && <p className="text-sm text-charcoal/80">{item.details}</p>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {project.handoverNotes && (
          <Section title="Good to know">
            <div className="space-y-1.5">
              {lines(project.handoverNotes).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </Section>
        )}

        {relevant.length > 0 && (
          <Section title="What renews, and when">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-sage-600 border-b border-sage/30">
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">Renews</th>
                  <th className="py-2">Paid by</th>
                </tr>
              </thead>
              <tbody>
                {relevant.map((r) => (
                  <tr key={r.id} className="border-b border-sage/15 align-top">
                    <td className="py-2 pr-3">
                      <span className="font-semibold">{r.name}</span>
                      <span className="block text-xs text-charcoal/70">{renewalKindLabels[r.kind]}</span>
                    </td>
                    <td className="py-2 pr-3">{r.provider || "–"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {longDate(r.renewsOn)}
                      {r.autoRenew && <span className="block text-xs text-charcoal/70">renews automatically</span>}
                    </td>
                    <td className="py-2">{r.paidBy === "client" ? "You" : "CodeMotive (billed to you)"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {plans.length > 0 && (
          <Section title="Your care plan">
            {plans.map((plan) => (
              <div key={plan.id}>
                <p className="font-semibold">
                  {plan.name}: {money(plan.amount, plan.currency)} per {plan.interval === "monthly" ? "month" : "year"}
                </p>
                {plan.description && <p className="text-sm text-charcoal/80">{plan.description}</p>}
              </div>
            ))}
          </Section>
        )}

        <Section title="Need help?">
          <p>
            Email <strong>{site.email}</strong> or WhatsApp <strong>{site.whatsappDisplay}</strong>. {site.replyPromise}
          </p>
        </Section>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">{title}</h2>
      {children}
    </section>
  )
}
