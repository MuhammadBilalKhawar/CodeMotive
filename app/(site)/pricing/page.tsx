import { faqJsonLd } from "@/lib/seo"
import Link from "next/link"
import { ArrowRight, Check, Info, Minus } from "lucide-react"
import { buildPackageIds, carePlanIds, customQuoteIds, pickPackages } from "@/data/pricing"
import { getPricing } from "@/lib/content"
import { PageHero } from "@/components/page-hero"
import { Section, SectionHeading } from "@/components/section"
import { PricingCard } from "@/components/pricing-card"
import { CurrencyToggle } from "@/components/price"
import { FaqList } from "@/components/faq-list"
import { CtaBand } from "@/components/cta-band"
import { JsonLd } from "@/components/json-ld"
import { getFaqs, seoMetadata } from "@/lib/cms"

export const generateMetadata = () => seoMetadata("/pricing")

export default async function PricingPage() {
  const [{ packages, settings }, faqs] = await Promise.all([getPricing(), getFaqs().then((f) => f.pricing)])

  const details = [
    { title: "What affects the price", icon: Info, items: settings.priceFactors },
    { title: "Not included", icon: Minus, items: settings.notIncludedAnywhere },
    {
      title: "Payment terms",
      icon: Check,
      items: [
        settings.paymentTerms.split,
        `Pakistan (PKR): ${settings.paymentTerms.methods.PKR}`,
        `International (USD): ${settings.paymentTerms.methods.USD}`,
      ],
    },
  ]

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <PageHero eyebrow="Pricing" title="Simple, upfront pricing" intro="Fixed quote before we start. No hourly billing, no hidden costs.">
        <CurrencyToggle />
      </PageHero>

      <Section>
        <SectionHeading eyebrow="Packages" title="Websites and" accent="online stores" />
        <div data-reveal-group className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 pt-4">
          {pickPackages(packages, buildPackageIds).map((pkg) => (
            <PricingCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="Custom quote"
          title="Integrations and"
          accent="AI automation"
          intro="These depend on your tools and workflow, so we quote them after a short call. The quote is fixed before any work starts."
        />
        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pickPackages(packages, customQuoteIds).map((pkg) => (
            <PricingCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-14 items-start">
          <SectionHeading eyebrow="Care plans" title="Monthly hosting and" accent="maintenance" intro={settings.hostingNote} />
          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pickPackages(packages, carePlanIds).map((pkg) => (
              <PricingCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      </Section>

      <Section tone="white">
        <div data-reveal-group className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {details.map(({ title, icon: Icon, items }) => (
            <div key={title} className="gradient-border gradient-border-light rounded-3xl bg-neutral p-7">
              <h2 className="font-heading font-bold text-xl text-forest mb-5">{title}</h2>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-mint/60 flex items-center justify-center">
                      <Icon className="w-3 h-3 text-forest" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16">
          <div>
            <SectionHeading eyebrow="FAQ" title="Pricing" accent="questions" />
            <Link href="/terms" className="group inline-flex items-center gap-1.5 font-semibold text-forest hover:text-sage-600">
              Read our terms
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
          <FaqList items={faqs} />
        </div>
      </Section>

      <CtaBand title="Not sure which one?" text="Tell us about your business and we'll recommend the right package." />
    </>
  )
}
