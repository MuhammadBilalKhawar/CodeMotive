import { Quote } from "lucide-react"
import { getTestimonials } from "@/lib/cms"
import { Section, SectionHeading } from "@/components/section"

// Hidden completely until real, verifiable testimonials are added in the admin.
export async function Testimonials() {
  const testimonials = await getTestimonials()
  if (testimonials.length === 0) return null

  return (
    <Section tone="white">
      <SectionHeading eyebrow="Client reviews" title="What clients say" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <figure key={t.sourceUrl} className="bg-neutral border border-sage/20 rounded-2xl p-6 flex flex-col">
            <Quote className="w-6 h-6 text-sage mb-4" aria-hidden />
            <blockquote className="text-charcoal leading-relaxed mb-5">{t.quote}</blockquote>
            <figcaption className="mt-auto text-sm">
              <span className="font-semibold text-forest">{t.name}</span>
              <span className="text-charcoal/80">
                {" "}
                · {t.business}, {t.country}
              </span>
              <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="block mt-1 text-sage-600 font-medium underline underline-offset-4">
                View original review
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}
