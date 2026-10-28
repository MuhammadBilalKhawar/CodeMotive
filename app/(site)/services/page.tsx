import { getPricing } from "@/lib/content"
import { PageHero } from "@/components/page-hero"
import { Section } from "@/components/section"
import { ServiceCard } from "@/components/service-card"
import { CtaBand } from "@/components/cta-band"
import { getServices, seoMetadata } from "@/lib/cms"

export const generateMetadata = () => seoMetadata("/services")

export default async function ServicesPage() {
  const [{ packages }, services] = await Promise.all([getPricing(), getServices()])

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Websites, stores and automations for your business"
        intro="CodeMotive builds business websites and Shopify stores, connects them to your tools and keeps them running. Each service has a starting price or a fixed custom quote."
      />
      <Section>
        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} packages={packages} />
          ))}
        </div>
      </Section>
      <CtaBand title="Not sure which service you need?" text="Tell us about your business and we'll recommend the right fit." />
    </>
  )
}
