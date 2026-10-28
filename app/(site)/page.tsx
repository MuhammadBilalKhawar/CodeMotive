import { faqJsonLd } from "@/lib/seo"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Mail, MessageCircle, Scissors, ShoppingBag, UtensilsCrossed, Wrench } from "lucide-react"
import { buildPackageIds, pickPackages } from "@/data/pricing"
import { featuredProjects } from "@/data/projects"
import { getPricing, getProjects } from "@/lib/content"
import { getFaqs, getHome, getServices, getSite, getTeam, seoMetadata } from "@/lib/cms"
import { Hero } from "@/components/home/hero"
import { HowItWorks } from "@/components/home/how-it-works"
import { Testimonials } from "@/components/home/testimonials"
import { Section, SectionHeading, buttonStyles } from "@/components/section"
import { ServiceCard } from "@/components/service-card"
import { ProjectCard } from "@/components/project-card"
import { PricingCard } from "@/components/pricing-card"
import { CurrencyToggle } from "@/components/price"
import { FounderCard } from "@/components/founder-card"
import { FaqList } from "@/components/faq-list"
import { JsonLd } from "@/components/json-ld"
import { ContactForm } from "@/components/contact-form"

export const generateMetadata = () => seoMetadata("/")

// One icon per audience card, in order.
const audienceIcons = [UtensilsCrossed, Scissors, ShoppingBag, Wrench]

// Bento placement for the five services (in data order).
const bento = ["lg:col-span-2 lg:row-span-2", "lg:col-span-2", "", "", "lg:col-span-2"]

export default async function Home() {
  const [{ packages }, projects, services, home, team, site, faqs] = await Promise.all([
    getPricing(),
    getProjects(),
    getServices(),
    getHome(),
    getTeam(),
    getSite(),
    getFaqs().then((f) => f.general),
  ])
  const featured = featuredProjects(projects)

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <Hero hero={home.hero} site={site} />

      <Section id="services">
        <SectionHeading
          eyebrow="What we build"
          title="Everything your business needs"
          accent="online"
          intro="From a first website to an online store with payments and automated replies. Pick one service or combine them."
        />
        <div data-reveal-group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, i) => (
            <ServiceCard
              key={service.slug}
              service={service}
              packages={packages}
              variant={i === 0 ? "feature" : "default"}
              className={`${bento[i]} ${i === 0 ? "sm:col-span-2" : ""}`}
            />
          ))}
          <Link
            href="/contact"
            data-spotlight
            className="spotlight spotlight-dark theme-dark group relative overflow-hidden rounded-3xl bg-forest p-7 sm:col-span-2 lg:col-span-2 flex flex-col justify-between gap-8 glow-forest"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-grid" />
              <div className="aurora w-80 h-80 -bottom-40 -right-20" />
            </div>
            <div className="relative">
              <p className="eyebrow text-xs text-mint mb-3">Not sure where to start?</p>
              <p className="font-heading font-bold text-2xl text-white max-w-sm">
                Tell us about your business and we&apos;ll recommend the right fit.
              </p>
            </div>
            <span className="relative inline-flex items-center gap-2 font-semibold text-mint">
              Get a free quote
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:rotate-45" aria-hidden />
            </span>
          </Link>
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading eyebrow="Who it's for" title="Built for small and medium" accent="businesses" />
        <div data-reveal-group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {home.audiences.map(({ title, text, href }, i) => {
            const Icon = audienceIcons[i] ?? Wrench
            return (
            <Link
              key={title}
              href={href}
              data-spotlight
              className="spotlight gradient-border gradient-border-light group rounded-3xl bg-neutral p-7 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="mb-6 w-14 h-14 rounded-2xl bg-forest flex items-center justify-center glow-forest transition-transform duration-300 group-hover:scale-110">
                <Icon className="w-6 h-6 text-mint" aria-hidden />
              </span>
              <h3 className="font-heading font-bold text-lg text-forest mb-2">{title}</h3>
              <p className="text-sm text-charcoal/85 leading-relaxed">{text}</p>
            </Link>
            )
          })}
        </div>
      </Section>

      {featured.length > 0 && (
        <Section id="work">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12 md:mb-14">
            <SectionHeading eyebrow="Featured work" title="Recent" accent="projects" className="mb-0 md:mb-0" />
            <Link href="/work" className={`group ${buttonStyles.secondaryOnLight} w-fit`}>
              See all work
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </Section>
      )}

      <HowItWorks steps={home.steps} />

      <Section>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple, upfront"
            accent="pricing"
            intro="Fixed quote before we start. No hourly billing, no hidden costs."
            className="mb-0 md:mb-0"
          />
          <CurrencyToggle className="w-fit" />
        </div>
        <div data-reveal-group className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 pt-4 items-stretch">
          {pickPackages(packages, buildPackageIds).map((pkg) => (
            <PricingCard key={pkg.id} pkg={pkg} compact />
          ))}
        </div>
        <Link href="/pricing" className="group mt-10 inline-flex items-center gap-1.5 font-semibold text-forest hover:text-sage-600">
          See all prices, care plans and what&apos;s included
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="Meet the founders"
          title="The people building"
          accent="your website"
          intro="You work directly with the two of us, from the first call to launch."
        />
        <div data-reveal-group className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {team.map((founder) => (
            <FounderCard key={founder.name} founder={founder} />
          ))}
        </div>
      </Section>

      <Testimonials />

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16">
          <SectionHeading eyebrow="FAQ" title="Common" accent="questions" intro={`Can't find your answer? Message us. ${site.replyPromise}`} />
          <FaqList items={faqs} />
        </div>
      </Section>

      <Section tone="dark" id="contact">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-start">
          <div>
            <SectionHeading
              tone="dark"
              eyebrow="Get a free quote"
              title="Tell us about"
              accent="your project"
              intro={`Send a few details and we'll reply with next steps and a fixed quote. ${site.replyPromise}`}
            />
            <ul data-reveal className="space-y-3">
              <li>
                <a href={`mailto:${site.email}`} className="glass gradient-border flex items-center gap-4 rounded-2xl px-5 py-4 text-mint hover:text-white transition-colors">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-gradient flex items-center justify-center">
                    <Mail className="w-4 h-4 text-forest" aria-hidden />
                  </span>
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass gradient-border flex items-center gap-4 rounded-2xl px-5 py-4 text-mint hover:text-white transition-colors"
                >
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-gradient flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-forest" aria-hidden />
                  </span>
                  WhatsApp {site.whatsappDisplay}
                </a>
              </li>
            </ul>
          </div>
          <div data-reveal>
            <ContactForm tone="dark" packages={packages} />
          </div>
        </div>
      </Section>
    </>
  )
}
