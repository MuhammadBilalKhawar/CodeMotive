import { cn } from "@/lib/utils"

export const gutter = "px-4 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%]"

const tones = {
  light: "theme-light bg-neutral text-charcoal",
  white: "theme-light bg-white text-charcoal",
  dark: "bg-forest text-neutral",
}

export type Tone = keyof typeof tones

type SectionProps = {
  tone?: Tone
  id?: string
  className?: string
  children: React.ReactNode
}

// Page rhythm: dark forest hero -> neutral sections -> occasional forest band.
export function Section({ tone = "light", id, className, children }: SectionProps) {
  return (
    <section id={id} className={cn("relative overflow-hidden", tones[tone], gutter, "py-20 md:py-28", className)}>
      {tone === "dark" ? <DarkDecor /> : <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-grid-light" />}
      <div className="relative">{children}</div>
    </section>
  )
}

// Grid and two slow-drifting glows behind dark sections.
export function DarkDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-grid" />
      <div data-drift className="aurora w-[520px] h-[520px] -top-48 -right-40" />
      <div data-drift className="aurora aurora-sage w-[460px] h-[460px] -bottom-56 -left-40" />
    </div>
  )
}

type SectionHeadingProps = {
  eyebrow: string
  title: string
  // Optional words appended to the title in the brand gradient.
  accent?: string
  intro?: string
  tone?: Tone
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({ eyebrow, title, accent, intro, tone = "light", align = "left", className }: SectionHeadingProps) {
  const dark = tone === "dark"
  return (
    <div data-reveal className={cn("max-w-3xl mb-12 md:mb-14", align === "center" && "mx-auto text-center", className)}>
      <p className={cn("eyebrow mb-4 inline-flex items-center gap-3", dark ? "text-mint" : "text-sage-600")}>
        <span aria-hidden className="h-px w-8 bg-brand-gradient" />
        {eyebrow}
      </p>
      <h2 className={cn("font-heading font-bold text-3xl md:text-[2.75rem] leading-[1.15] tracking-tight", dark ? "text-white" : "text-forest")}>
        {title}
        {accent && (
          <>
            {" "}
            <span className={dark ? "text-gradient-mint" : "text-gradient-forest"}>{accent}</span>
          </>
        )}
      </h2>
      {intro && <p className={cn("mt-5 text-lg leading-relaxed", dark ? "text-mint" : "text-charcoal/85")}>{intro}</p>}
    </div>
  )
}

const buttonBase =
  "btn-shine inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5"

export const buttonStyles = {
  // Primary on dark sections: mint with forest text.
  primaryOnDark: `${buttonBase} bg-mint text-forest glow-mint`,
  // Primary on light sections: forest with neutral text.
  primaryOnLight: `${buttonBase} bg-forest text-neutral glow-forest hover:bg-forest-700`,
  secondaryOnDark: `${buttonBase} glass border border-sage/50 text-mint hover:border-mint/60`,
  secondaryOnLight: `${buttonBase} border border-sage text-forest bg-white/60 hover:bg-mint/40`,
}
