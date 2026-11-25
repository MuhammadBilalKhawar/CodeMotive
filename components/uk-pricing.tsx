import Link from "next/link"
import { ArrowRight, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SHOW_LAUNCH_OFFER,
  formatGbp,
  launchOfferText,
  raisesPriceLabel,
  ukCarePlans,
  ukCareNote,
  ukCtaLabel,
  ukCustomProject,
  ukExtras,
  ukPlans,
  ukTerms,
  type UkOffer,
} from "@/data/pricing-uk"
import { Section, SectionHeading } from "@/components/section"

// UK (GBP) pricing UI. Every word and figure comes from data/pricing-uk.ts.
// Server components only: the market switch lives in components/price.tsx.

export function LaunchOfferBanner() {
  if (!SHOW_LAUNCH_OFFER) return null
  return (
    <p role="note" className="mb-8 rounded-2xl bg-mint/50 border border-sage/30 px-5 py-3.5 text-sm font-medium text-forest">
      {launchOfferText}
    </p>
  )
}

export function UkOfferCard({ offer }: { offer: UkOffer }) {
  const popular = Boolean(offer.popular)
  const monthly = offer.unit === "monthly"

  return (
    <article
      data-spotlight
      className={cn(
        "spotlight gradient-border relative flex flex-col rounded-3xl p-7 sm:p-8 transition-transform duration-300 hover:-translate-y-1",
        popular ? "theme-dark spotlight-dark bg-forest text-neutral glow-forest" : "gradient-border-light bg-white text-charcoal",
      )}
    >
      {popular && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-60" />
            <div className="aurora w-80 h-80 -top-32 -right-24" />
          </div>
          <p className="absolute -top-3.5 left-7 eyebrow text-xs bg-brand-gradient text-forest px-3.5 py-1.5 rounded-full glow-mint">
            Most popular
          </p>
        </>
      )}

      <div className="relative flex flex-col flex-1">
        <h3 className={cn("font-heading font-bold text-xl mb-4", popular ? "text-white" : "text-forest")}>{offer.name}</h3>

        <p className={cn("mb-6", popular ? "text-white" : "text-forest")}>
          {offer.isFrom && <span className="text-base font-medium opacity-80">from </span>}
          <span className="font-heading font-bold text-4xl tracking-tight">{formatGbp(offer.from)}</span>
          {monthly && <span className="text-base font-medium">/month</span>}
        </p>

        <div aria-hidden className={cn("h-px mb-6", popular ? "bg-sage/30" : "bg-sage/20")} />

        {offer.includes.length > 0 && (
          <ul className="space-y-3 mb-7">
            {offer.includes.map((item) => (
              <li key={item} className="flex gap-3 text-sm">
                <span
                  className={cn(
                    "mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center",
                    popular ? "bg-mint/15 text-mint" : "bg-mint/50 text-forest",
                  )}
                >
                  <Check className="w-3 h-3" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}

        {offer.raisesPrice && (
          <p className="text-sm mb-7">
            <strong className={popular ? "text-white" : "text-forest"}>{raisesPriceLabel}</strong> {offer.raisesPrice}
          </p>
        )}

        {offer.delivery && (
          <div className={cn("rounded-xl px-3 py-2.5 text-sm mb-7", popular ? "bg-forest-800/80" : "bg-neutral")}>
            <p className={cn("flex items-center gap-1.5 text-xs font-medium", popular ? "text-mint" : "text-sage-600")}>
              <Clock className="w-3.5 h-3.5" aria-hidden />
              Delivery
            </p>
            <p className="font-semibold mt-0.5">{offer.delivery}</p>
          </div>
        )}

        {/* Same link the existing pricing cards use. */}
        <Link
          href={`/contact?package=${offer.contactPackage}`}
          className={cn(
            "btn-shine group mt-auto inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600",
            popular ? "bg-mint text-forest glow-mint" : "bg-forest text-neutral hover:bg-forest-700",
          )}
        >
          {ukCtaLabel}
          <span className="sr-only"> for {offer.name}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  )
}

export function UkCustomProjectCard() {
  return (
    <article className="gradient-border gradient-border-light flex flex-col rounded-3xl bg-white p-7 sm:p-8 text-charcoal">
      <h3 className="font-heading font-bold text-xl text-forest mb-4">{ukCustomProject.name}</h3>
      <p className="mb-7 text-base leading-relaxed">
        <strong className="text-forest">
          from {formatGbp(ukCustomProject.from)}
        </strong>
        , {ukCustomProject.note}
      </p>
      <Link
        href="/contact"
        className="btn-shine group mt-auto inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-xl bg-forest text-neutral transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"
      >
        {ukCtaLabel}
        <span className="sr-only"> for {ukCustomProject.name}</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </article>
  )
}

export function UkTerms() {
  return (
    <div className="gradient-border gradient-border-light rounded-3xl bg-neutral p-7 sm:p-8 max-w-3xl">
      <h2 className="font-heading font-bold text-xl text-forest mb-5">Terms</h2>
      <ol className="space-y-3 list-decimal pl-5 marker:font-semibold marker:text-forest">
        {ukTerms.map((term) => (
          <li key={term} className="pl-1 leading-relaxed">
            {term}
          </li>
        ))}
      </ol>
    </div>
  )
}

// Plan grid: one column on phones, two on tablets, four on wide screens.
const planGrid = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 sm:gap-6 pt-4 items-stretch"

// The whole UK body of /pricing.
export function UkPricingSections() {
  return (
    <>
      <Section>
        <LaunchOfferBanner />
        <SectionHeading eyebrow="Packages" title="Websites and" accent="online stores" />
        <div className={planGrid}>
          {ukPlans.map((plan) => (
            <UkOfferCard key={plan.id} offer={plan} />
          ))}
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading eyebrow="Extras" title="Integrations," accent="AI and custom projects" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-stretch">
          {ukExtras.map((extra) => (
            <UkOfferCard key={extra.id} offer={extra} />
          ))}
          <UkCustomProjectCard />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Care plans" title="Monthly" accent="care plans" intro={ukCareNote} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-stretch">
          {ukCarePlans.map((plan) => (
            <UkOfferCard key={plan.id} offer={plan} />
          ))}
        </div>
      </Section>

      <Section tone="white">
        <UkTerms />
      </Section>
    </>
  )
}

// The compact UK pricing block on the home page.
export function UkHomePricing() {
  return (
    <>
      <LaunchOfferBanner />
      <div className={planGrid}>
        {ukPlans.map((plan) => (
          <UkOfferCard key={plan.id} offer={plan} />
        ))}
      </div>
    </>
  )
}

// Cards for one service page in the UK market.
export function UkServiceOffers({ offers }: { offers: UkOffer[] }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 pt-4", offers.length > 2 ? "lg:grid-cols-3" : "max-w-4xl")}>
      {offers.map((offer) => (
        <UkOfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}
