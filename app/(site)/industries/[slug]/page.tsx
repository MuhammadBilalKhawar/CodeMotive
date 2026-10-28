import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Check } from "lucide-react"
import { industries } from "@/data/industries"
import { getIndustry, getServices } from "@/lib/cms"
import { findPackage, formatPrice } from "@/data/pricing"
import { visibleProjects } from "@/data/projects"
import { getPricing, getProjects } from "@/lib/content"
import { faqJsonLd, pageMetadata } from "@/lib/seo"
import type { PricingPackage } from "@/lib/content-schema"
import { PageHero } from "@/components/page-hero"
import { Section, SectionHeading } from "@/components/section"
import { ServiceCard } from "@/components/service-card"
import { ProjectCard } from "@/components/project-card"
import { FaqList } from "@/components/faq-list"
import { CtaBand } from "@/components/cta-band"
import { JsonLd } from "@/components/json-ld"
import { industryIcons } from "@/components/industry-icons"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return industries.map((industry) => ({ slug: industry.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const industry = await getIndustry((await params).slug)
  if (!industry) return {}
  return pageMetadata({ title: industry.metaTitle, description: industry.metaDescription, path: `/industries/${industry.slug}` })
}

// The page HTML is the same for every visitor, so quote both currencies.
function priceText(pkg: PricingPackage | undefined) {
  if (!pkg) return "a fixed quote"
  const { PKR, USD } = pkg.priceFrom
  if (PKR !== null && USD !== null) return `${formatPrice(PKR, "PKR")} in Pakistan or ${formatPrice(USD, "USD")} internationally`
  if (PKR !== null) return formatPrice(PKR, "PKR")
  if (USD !== null) return formatPrice(USD, "USD")
  return "a fixed custom quote"
}

export default async function IndustryPage({ params }: Props) {
  const industry = await getIndustry((await params).slug)
  if (!industry) notFound()

  const [{ packages }, projects] = await Promise.all([getPricing(), getProjects()])
  const intro = industry.intro.replace("{price}", priceText(findPackage(packages, industry.packageId)))
  const services = await getServices()
  const related = industry.serviceSlugs.map((slug) => services.find((s) => s.slug === slug)).filter((s) => s !== undefined)
  const examples = visibleProjects(projects).filter((p) =>
    industry.projectIndustries.some((word) => p.industry.toLowerCase().includes(word)),
  )
  const Icon = industryIcons[industry.icon]
  const path = `/industries/${industry.slug}`

  return (
    <>
      <JsonLd data={faqJsonLd(industry.faqs)} />
      <PageHero
        eyebrow={industry.short}
        title={industry.name}
        intro={intro}
        breadcrumbs={[
          { name: "Industries", path: "/industries" },
          { name: industry.short, path },
        ]}
      />

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-14 items-start">
          <div className="lg:sticky lg:top-28">
            <SectionHeading eyebrow="The problem" title="What gets in the" accent="way today" intro={industry.problem} className="mb-8" />
            <span data-reveal className="w-16 h-16 rounded-2xl bg-forest flex items-center justify-center glow-forest">
              <Icon className="w-7 h-7 text-mint" aria-hidden />
            </span>
          </div>
          <div>
            <h2 data-reveal className="font-heading font-bold text-2xl text-forest mb-6">
              What your website will do
            </h2>
            <ul data-reveal-group className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {industry.needs.map((need) => (
                <li key={need.title} className="gradient-border gradient-border-light rounded-2xl bg-white p-5">
                  <span className="mb-3 w-8 h-8 rounded-full bg-mint/60 flex items-center justify-center">
                    <Check className="w-4 h-4 text-forest" aria-hidden />
                  </span>
                  <h3 className="font-heading font-semibold text-forest mb-1.5">{need.title}</h3>
                  <p className="text-sm text-charcoal/85 leading-relaxed">{need.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading eyebrow="What we'd build" title="The right services for" accent={industry.short.toLowerCase()} />
        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((service) => (
            <ServiceCard key={service.slug} service={service} packages={packages} />
          ))}
        </div>
      </Section>

      {examples.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Our work" title="Something" accent="we've built" />
          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examples.slice(0, 3).map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </Section>
      )}

      <Section tone={examples.length > 0 ? "white" : "light"}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16">
          <SectionHeading eyebrow="FAQ" title="Common" accent="questions" />
          <FaqList items={industry.faqs} />
        </div>
      </Section>

      <CtaBand
        title="Want a site like this for your business?"
        text="Tell us about your business and we'll send a fixed quote."
        href={`/contact?package=${industry.packageId}`}
      />
    </>
  )
}
