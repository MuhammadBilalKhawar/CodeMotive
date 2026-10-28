import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Check, Clock, Tag } from "lucide-react"
import { services } from "@/data/services"
import { getService } from "@/lib/cms"
import { pickPackages } from "@/data/pricing"
import { visibleProjects } from "@/data/projects"
import { getPricing, getProjects } from "@/lib/content"
import { PageHero } from "@/components/page-hero"
import { Section, SectionHeading } from "@/components/section"
import { PricingCard } from "@/components/pricing-card"
import { StartingFrom } from "@/components/price"
import { ProjectCard } from "@/components/project-card"
import { FaqList } from "@/components/faq-list"
import { CtaBand } from "@/components/cta-band"
import { serviceIcons } from "@/components/service-card"
import { JsonLd } from "@/components/json-ld"
import { faqJsonLd, pageMetadata, serviceJsonLd } from "@/lib/seo"

type Props = { params: Promise<{ slug: string }> }

// Known slugs are prebuilt; anything else hits notFound() below. (Not using
// dynamicParams = false: it makes admin revalidation of these pages 404.)
export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getService((await params).slug)
  if (!service) return {}
  return pageMetadata({ title: service.metaTitle, description: service.metaDescription, path: `/services/${service.slug}` })
}

export default async function ServicePage({ params }: Props) {
  const service = await getService((await params).slug)
  if (!service) notFound()

  const [{ packages }, projects] = await Promise.all([getPricing(), getProjects()])
  const pkgs = pickPackages(packages, service.packageIds)
  const hasPublishedPrice = pkgs.some((p) => p.priceFrom.PKR !== null || p.priceFrom.USD !== null)
  const example = visibleProjects(projects).find((p) => p.services.includes(service.projectTag))
  const Icon = serviceIcons[service.slug]

  return (
    <>
      <JsonLd data={serviceJsonLd({ name: service.name, description: service.intro, path: `/services/${service.slug}`, packages: pkgs })} />
      <JsonLd data={faqJsonLd(service.faqs)} />
      <PageHero
        eyebrow="Services"
        title={service.name}
        intro={service.intro}
        breadcrumbs={[
          { name: "Services", path: "/services" },
          { name: service.name, path: `/services/${service.slug}` },
        ]}
      />

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-14 items-start">
          <div>
            <SectionHeading eyebrow="The problem" title="What this" accent="solves" intro={service.problem} />
            <h3 data-reveal className="font-heading font-bold text-2xl text-forest mb-6">What&apos;s included</h3>
            <ul data-reveal-group className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {service.included.map((item) => (
                <li key={item} className="gradient-border gradient-border-light flex gap-3 rounded-2xl bg-white p-4">
                  <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-mint/60 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-forest" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside data-reveal className="lg:sticky lg:top-28 relative overflow-hidden rounded-3xl bg-forest text-neutral theme-dark p-7 sm:p-8 glow-forest">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-grid" />
              <div className="aurora w-72 h-72 -top-28 -right-20" />
            </div>
            <div className="relative space-y-6">
              <span className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center">
                <Icon className="w-5 h-5 text-forest" aria-hidden />
              </span>
              <div className="flex gap-4">
                <Tag className="w-5 h-5 mt-1 shrink-0 text-sage" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-mint">Price</p>
                  <StartingFrom packages={pkgs} className="font-heading font-bold text-3xl text-white" />
                  {!hasPublishedPrice && <p className="text-sm text-mint mt-1">Fixed quote after a free call.</p>}
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="w-5 h-5 mt-1 shrink-0 text-sage" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-mint">Timeline</p>
                  <p className="text-white font-semibold">{service.timeline}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      {hasPublishedPrice && (
        <Section tone="white">
          <SectionHeading eyebrow="Packages" title={service.name} accent="pricing" />
          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 max-w-4xl pt-4">
            {pkgs.map((pkg) => (
              <PricingCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </Section>
      )}

      {example && (
        <Section>
          <SectionHeading eyebrow="Example project" title="Something" accent="we've built" />
          <div data-reveal className="max-w-md">
            <ProjectCard project={example} />
          </div>
        </Section>
      )}

      <Section tone={example ? "white" : "light"}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16">
          <SectionHeading eyebrow="FAQ" title="Common" accent="questions" />
          <FaqList items={service.faqs} />
        </div>
      </Section>

      <CtaBand title="Ready to get started?" text="Tell us what you need and we'll send a fixed quote." href={`/contact?package=${service.packageIds[0]}`} />
    </>
  )
}
