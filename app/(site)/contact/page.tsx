import { Clock, Mail, MapPin, MessageCircle } from "lucide-react"
import { getPricing } from "@/lib/content"
import { PageHero } from "@/components/page-hero"
import { Section } from "@/components/section"
import { ContactForm } from "@/components/contact-form"
import { getSite, seoMetadata } from "@/lib/cms"

export const generateMetadata = () => seoMetadata("/contact")

export default async function ContactPage() {
  const [{ packages }, site] = await Promise.all([getPricing(), getSite()])

  const direct = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: site.whatsappDisplay,
      href: site.whatsappUrl,
      external: true,
    },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: "Location", value: site.fullAddress },
    { icon: Clock, label: "Response time", value: site.replyPromise },
  ]

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get a free quote"
        intro="Tell us a little about your business and what you need. We'll reply with next steps and a fixed quote."
      />
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-14 items-start">
          <div data-reveal>
            <ContactForm packages={packages} />
          </div>
          <aside data-reveal className="lg:sticky lg:top-28 space-y-4">
            <h2 className="font-heading font-bold text-2xl text-forest mb-2">Prefer to reach us directly?</h2>
            <ul className="space-y-3">
              {direct.map(({ icon: Icon, label, value, href, external }) => {
                const content = (
                  <>
                    <span className="w-11 h-11 shrink-0 rounded-xl bg-forest flex items-center justify-center">
                      <Icon className="w-5 h-5 text-mint" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-sage-600">{label}</span>
                      <span className="block font-semibold text-forest break-all">{value}</span>
                    </span>
                  </>
                )
                const cardClass = "gradient-border gradient-border-light bg-white rounded-2xl p-4 flex items-center gap-4"
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                        className={`${cardClass} transition-transform hover:-translate-y-0.5`}
                      >
                        {content}
                      </a>
                    ) : (
                      <div className={cardClass}>{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      </Section>
    </>
  )
}
