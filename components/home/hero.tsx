import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, Globe2, Lock, MapPin, MessageCircle, Smartphone, Zap } from "lucide-react"
import type { HomeContent } from "@/lib/cms/schemas"
import type { SiteInfo } from "@/lib/cms/site-info"
import { DarkDecor, buttonStyles, gutter } from "@/components/section"
import { ToolsMarquee } from "@/components/home/tools-marquee"

// Icon and position of each floating chip around the browser (text is edited in the admin).
const chipStyles = [
  { icon: CheckCircle2, position: "lg:-left-10 lg:top-16" },
  { icon: Clock, position: "lg:-right-8 lg:top-36" },
  { icon: MessageCircle, position: "lg:-left-14 lg:bottom-24" },
  { icon: Smartphone, position: "lg:-right-6 lg:-bottom-5" },
]
const trustIcons = [MapPin, Globe2, Zap]

export function Hero({ hero, site }: { hero: HomeContent["hero"]; site: SiteInfo }) {
  const chips = hero.chips.slice(0, chipStyles.length).map((text, i) => ({ text, ...chipStyles[i] }))
  return (
    <section className="relative overflow-hidden bg-forest">
      <DarkDecor />
      <div aria-hidden className="pointer-events-none absolute -right-48 -top-48 w-[640px] h-[640px] rounded-full border-[56px] border-mint opacity-[0.05]" />

      <div className={`relative ${gutter} pt-32 pb-16 md:pt-40 md:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-12 xl:gap-20 items-center`}>
        <div>
          <p data-hero-item style={{ "--i": 0 } as React.CSSProperties} className="inline-flex items-center gap-2.5 rounded-full glass border border-mint/15 px-4 py-2 mb-7">
            <span className="pulse-dot w-2 h-2 rounded-full bg-mint" aria-hidden />
            <span className="eyebrow text-xs max-sm:tracking-[0.14em] text-mint">{site.tagline}</span>
          </p>

          <h1 className="font-heading font-bold text-[2.3rem] leading-[1.08] sm:text-6xl lg:text-[3.6rem] xl:text-[4.1rem] tracking-tight text-white mb-7">
            {hero.title} <span className="text-gradient-mint">{hero.titleAccent}</span>
          </h1>

          <p className="text-lg md:text-xl text-mint leading-relaxed max-w-xl mb-9">
            {hero.subline}
          </p>

          <div data-hero-item style={{ "--i": 1 } as React.CSSProperties} className="flex flex-col sm:flex-row gap-4 mb-9">
            <Link href="/contact" className={`group ${buttonStyles.primaryOnDark}`}>
              Get a free quote
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </Link>
            <Link href="/work" className={buttonStyles.secondaryOnDark}>
              See our work
            </Link>
          </div>

          <ul data-hero-item style={{ "--i": 2 } as React.CSSProperties} className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mint/85" aria-label="About us">
            {hero.trust.map((text, i) => {
              const Icon = trustIcons[i] ?? Zap
              return (
                <li key={text} className="inline-flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-sage" aria-hidden />
                  {text}
                </li>
              )
            })}
          </ul>
        </div>

        <div data-hero-item style={{ "--i": 3 } as React.CSSProperties} className="relative lg:pl-6">
          <BrowserMock />
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 lg:mt-0 lg:block">
            {chips.map(({ icon: Icon, text, position }) => (
              <li key={text} className={`lg:absolute ${position} lg:max-w-[15rem]`}>
                <div data-float className="glass gradient-border rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-medium text-neutral">
                  <span className="w-8 h-8 shrink-0 rounded-xl bg-brand-gradient flex items-center justify-center">
                    <Icon className="w-4 h-4 text-forest" aria-hidden />
                  </span>
                  {text}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ToolsMarquee />
    </section>
  )
}

// Decorative website preview: a browser frame with a skeleton page.
function BrowserMock() {
  return (
    <div aria-hidden className="glass gradient-border rounded-3xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-mint/10">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-mint/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-mint/25" />
          <span className="w-2.5 h-2.5 rounded-full bg-mint/15" />
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-full bg-forest/70 px-3 py-1.5 text-xs text-mint/80">
          <Lock className="w-3 h-3" />
          yourbusiness.com
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-20 h-3 rounded-full bg-mint/60" />
          <div className="hidden sm:flex gap-3">
            <div className="w-10 h-2 rounded-full bg-mint/20" />
            <div className="w-10 h-2 rounded-full bg-mint/20" />
            <div className="w-10 h-2 rounded-full bg-mint/20" />
          </div>
        </div>

        <div className="grid grid-cols-[1.3fr_1fr] gap-5 items-center">
          <div className="space-y-3">
            <div className="h-4 w-11/12 rounded-full bg-brand-gradient" />
            <div className="h-4 w-8/12 rounded-full bg-mint/50" />
            <div className="h-2 w-full rounded-full bg-mint/15 mt-4" />
            <div className="h-2 w-10/12 rounded-full bg-mint/15" />
            <div className="flex gap-2 pt-3">
              <div className="h-7 w-24 rounded-lg bg-mint" />
              <div className="h-7 w-20 rounded-lg border border-mint/30" />
            </div>
          </div>
          <div className="aspect-square rounded-2xl bg-forest-700/80 border border-mint/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid" />
            <div className="absolute inset-4 rounded-xl bg-brand-gradient opacity-30" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-forest/60 border border-mint/10 p-3 space-y-2">
              <div className="w-6 h-6 rounded-lg bg-mint/25" />
              <div className="h-2 w-10/12 rounded-full bg-mint/30" />
              <div className="h-2 w-7/12 rounded-full bg-mint/15" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
