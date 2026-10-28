import { pageMetadata } from "@/lib/seo"
import { Mail, PencilRuler, ClipboardList } from "lucide-react"
import { PageHero } from "@/components/page-hero"
import { Section } from "@/components/section"
import { MockupForm } from "@/components/mockup-form"
import { getSite } from "@/lib/cms"

const days = (n: number) => `${n} working day${n === 1 ? "" : "s"}`

// For businesses we contacted by email: kept out of search, the nav and the sitemap.
export async function generateMetadata() {
  const { mockupDays } = await getSite()
  return pageMetadata({
    title: "Get Your Free Homepage Mockup",
    description: `Tell us about your business and we'll design a free mockup of your new homepage within ${days(mockupDays)}.`,
    path: "/free-mockup",
    noIndex: true,
  })
}

export default async function FreeMockupPage() {
  const { mockupDays } = await getSite()
  const steps = [
    { icon: ClipboardList, title: "Fill this in", text: "Two minutes about your business." },
    { icon: PencilRuler, title: "We design your mockup", text: "A homepage made for your business." },
    { icon: Mail, title: "We email it to you", text: `Within ${days(mockupDays)}. Free, no obligation.` },
  ]

  return (
    <>
      <PageHero
        eyebrow="Free mockup"
        title="Get your free homepage mockup"
        intro={`Tell us a little about your business and we'll design a mockup of your new homepage within ${days(mockupDays)}. Free, no obligation.`}
      />
      <Section>
        <ol data-reveal-group className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-4xl">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="gradient-border gradient-border-light flex items-start gap-4 rounded-2xl bg-white p-5">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-forest flex items-center justify-center">
                <Icon className="w-5 h-5 text-mint" aria-hidden />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-sage-600">Step {i + 1}</span>
                <span className="block font-heading font-bold text-forest">{title}</span>
                <span className="block text-sm text-charcoal/85">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div data-reveal className="max-w-4xl">
          <MockupForm />
        </div>
      </Section>
    </>
  )
}
