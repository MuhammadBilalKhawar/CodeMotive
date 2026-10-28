import { Hammer, MessagesSquare, Rocket, FileCheck2 } from "lucide-react"
import { Section, SectionHeading } from "@/components/section"
import type { HomeContent } from "@/lib/cms/schemas"

const stepIcons = [MessagesSquare, FileCheck2, Hammer, Rocket]

export function HowItWorks({ steps }: { steps: HomeContent["steps"] }) {
  return (
    <Section tone="dark">
      <SectionHeading tone="dark" eyebrow="How it works" title="From first call to launch" accent="in four steps" />

      <div className="relative">
        {/* Progress line that draws as you scroll: across on desktop, down on mobile. */}
        <div aria-hidden className="hidden lg:block absolute left-[12.5%] right-[12.5%] top-7 h-px bg-mint/10">
          <div data-draw-line="x" className="h-full w-full origin-left bg-brand-gradient" />
        </div>
        <div aria-hidden className="lg:hidden absolute left-7 top-7 bottom-7 w-px bg-mint/10">
          <div data-draw-line="y" className="h-full w-full origin-top bg-brand-gradient" />
        </div>

        <ol data-reveal-group className="relative grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-5">
          {steps.map(({ title, text }, index) => {
            const Icon = stepIcons[index] ?? Rocket
            return (
            <li key={title} className="flex lg:flex-col gap-5 lg:items-center lg:text-center">
              <span className="relative z-10 w-14 h-14 shrink-0 rounded-2xl bg-forest p-px bg-brand-gradient glow-mint">
                <span className="w-full h-full rounded-[0.95rem] bg-forest flex items-center justify-center text-mint">
                  <Icon className="w-6 h-6" aria-hidden />
                </span>
              </span>
              <div data-spotlight className="spotlight spotlight-dark glass gradient-border flex-1 w-full rounded-2xl p-6">
                <p className="eyebrow text-xs text-mint/85 mb-2">Step {index + 1}</p>
                <h3 className="font-heading font-semibold text-lg text-white mb-2">{title}</h3>
                <p className="text-mint leading-relaxed">{text}</p>
              </div>
            </li>
            )
          })}
        </ol>
      </div>
    </Section>
  )
}
