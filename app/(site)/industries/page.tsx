import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { getIndustries, seoMetadata } from "@/lib/cms"
import { PageHero } from "@/components/page-hero"
import { Section } from "@/components/section"
import { CtaBand } from "@/components/cta-band"
import { industryIcons } from "@/components/industry-icons"

export const generateMetadata = () => seoMetadata("/industries")

export default async function IndustriesPage() {
  const industries = await getIndustries()
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Websites built for how your business works"
        intro="A restaurant needs a menu and WhatsApp orders; a salon needs bookings; a shop needs cash on delivery. Pick your business to see what we'd build for you."
        breadcrumbs={[{ name: "Industries", path: "/industries" }]}
      />
      <Section>
        <div data-reveal-group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry) => {
            const Icon = industryIcons[industry.icon]
            return (
              <Link
                key={industry.slug}
                href={`/industries/${industry.slug}`}
                data-spotlight
                className="spotlight gradient-border gradient-border-light group flex flex-col rounded-3xl bg-white p-7 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <span className="w-14 h-14 rounded-2xl bg-forest flex items-center justify-center glow-forest">
                    <Icon className="w-6 h-6 text-mint" aria-hidden />
                  </span>
                  <span className="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center text-forest transition-[transform,background-color,color] duration-300 group-hover:bg-forest group-hover:text-mint group-hover:rotate-45">
                    <ArrowUpRight className="w-4 h-4" aria-hidden />
                  </span>
                </div>
                <h2 className="font-heading font-bold text-xl text-forest mb-2">{industry.name}</h2>
                <p className="text-sm text-charcoal/85 leading-relaxed">{industry.problem}</p>
              </Link>
            )
          })}
        </div>
      </Section>
      <CtaBand title="Don't see your business?" text="We build for most small and medium businesses. Tell us what you do and we'll suggest the right setup." />
    </>
  )
}
