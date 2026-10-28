import { CalendarCheck, FileText, Mail, MapPin, MessageCircle, Users, Wallet } from "lucide-react"
import { PageHero } from "@/components/page-hero"
import { FounderCard } from "@/components/founder-card"
import { Section, SectionHeading } from "@/components/section"
import { CtaBand } from "@/components/cta-band"
import { getPricing } from "@/lib/content"
import { getSite, getTeam, seoMetadata } from "@/lib/cms"

export const generateMetadata = () => seoMetadata("/about")

export default async function AboutPage() {
  const [{ settings }, founders, site] = await Promise.all([getPricing(), getTeam(), getSite()])

  const howWeWork = [
    {
      icon: FileText,
      title: "Fixed quote before we start",
      text: "After a free call we send a written quote with the scope, price and timeline. No hourly billing.",
    },
    {
      icon: Wallet,
      title: "Simple payment terms",
      text: `${settings.paymentTerms.split}. You see the finished work before the final payment.`,
    },
    {
      icon: CalendarCheck,
      title: "Weekly updates",
      text: "Every week you get a short update on what's done and what's next.",
    },
    {
      icon: Users,
      title: "You talk to the developers",
      text: "No account managers in between. The people building your site answer your messages.",
    },
  ]

  return (
    <>
      <PageHero
        eyebrow="About CodeMotive"
        title="A small Lahore team building websites that work for your business"
        intro={site.summary}
      />

      {/* TODO(Bilal): review this story; it's based on the founders' details and the previous about text. */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16">
          <SectionHeading eyebrow="Our story" title="Built by developers who" accent="ship real products" />
          <div data-reveal className="space-y-5 text-lg leading-relaxed">
            <p>
              CodeMotive was started by {founders.map((f) => f.name).join(" and ")}, two developers with hands-on
              experience building production web applications, Shopify apps and online stores.
            </p>
            <p>
              Many businesses we spoke to either had no website or had one that didn&apos;t bring in customers, and they
              rarely got a clear price up front. So we set up CodeMotive around a few simple rules: a fixed quote before
              any work starts, regular updates while we build, and a fast, mobile-friendly site you fully understand at
              handover.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading eyebrow="The founders" title="Who you'll" accent="work with" />
        <div data-reveal-group className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {founders.map((founder) => (
            <FounderCard key={founder.name} founder={founder} />
          ))}
        </div>
      </Section>

      <Section tone="dark">
        <SectionHeading tone="dark" eyebrow="How we work" title="Clear from the" accent="first call" />
        <div data-reveal-group className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {howWeWork.map(({ icon: Icon, title, text }) => (
            <div key={title} data-spotlight className="spotlight spotlight-dark glass gradient-border rounded-3xl p-7">
              <span className="mb-5 w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center">
                <Icon className="w-5 h-5 text-forest" aria-hidden />
              </span>
              <h3 className="font-heading font-semibold text-lg text-white mb-2">{title}</h3>
              <p className="text-mint leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <SectionHeading
            eyebrow="Where we are"
            title="Based in Lahore,"
            accent="working worldwide"
            intro={`We work with businesses in Pakistan and with clients internationally, over WhatsApp, email and video calls. ${site.replyPromise}`}
          />
          <ul data-reveal className="gradient-border gradient-border-light bg-white rounded-3xl p-7 sm:p-9 space-y-6">
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-mint/50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-forest" aria-hidden />
              </span>
              <span className="pt-2">{site.fullAddress}</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-mint/50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-forest" aria-hidden />
              </span>
              <a
                href={`mailto:${site.email}`}
                className="pt-2 text-forest font-semibold underline underline-offset-4 decoration-sage/50 hover:decoration-forest break-all"
              >
                {site.email}
              </a>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-mint/50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-forest" aria-hidden />
              </span>
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pt-2 text-forest font-semibold underline underline-offset-4 decoration-sage/50 hover:decoration-forest"
              >
                WhatsApp {site.whatsappDisplay}
              </a>
            </li>
          </ul>
        </div>
      </Section>

      <CtaBand />
    </>
  )
}
