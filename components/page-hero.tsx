import { DarkDecor, gutter } from "@/components/section"
import { Breadcrumbs } from "@/components/breadcrumbs"
import type { Crumb } from "@/lib/seo"

type PageHeroProps = {
  eyebrow: string
  title: string
  intro?: string
  // Trail after "Home", e.g. [{ name: "Services", path: "/services" }, ...].
  breadcrumbs?: Crumb[]
  children?: React.ReactNode
}

// Dark forest band at the top of inner pages; content below sits on neutral.
// The h1 and intro are never hidden for animation, so they paint immediately (LCP).
export function PageHero({ eyebrow, title, intro, breadcrumbs, children }: PageHeroProps) {
  return (
    <section className={`relative overflow-hidden bg-forest ${gutter} pt-36 pb-20 md:pt-44 md:pb-24`}>
      <DarkDecor />
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 w-[560px] h-[560px] rounded-full border-[48px] border-mint opacity-[0.05]" />
      <div className="relative max-w-3xl">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <p data-hero-item style={{ "--i": 0 } as React.CSSProperties} className="eyebrow text-mint mb-5 inline-flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-brand-gradient" />
          {eyebrow}
        </p>
        <h1 className="font-heading font-bold text-[2.1rem] sm:text-5xl md:text-[3.5rem] leading-[1.1] tracking-tight text-white mb-6">
          {title}
        </h1>
        {/* Not animated: on many pages this paragraph is the largest text (LCP). */}
        {intro && <p className="text-lg md:text-xl text-mint leading-relaxed">{intro}</p>}
        {children && (
          <div data-hero-item style={{ "--i": 1 } as React.CSSProperties} className="mt-8">
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
