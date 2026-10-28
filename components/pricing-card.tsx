import Link from "next/link"
import { ArrowRight, Check, Clock, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDelivery, type PricingPackage } from "@/data/pricing"
import { PackagePrice } from "@/components/price"

export function PricingCard({ pkg, compact = false }: { pkg: PricingPackage; compact?: boolean }) {
  const features = compact ? pkg.features.slice(0, 4) : pkg.features
  const popular = Boolean(pkg.popular)

  return (
    <article
      data-spotlight
      className={cn(
        "spotlight gradient-border relative flex flex-col rounded-3xl p-7 sm:p-8 transition-transform duration-300 hover:-translate-y-1",
        popular
          ? "theme-dark spotlight-dark bg-forest text-neutral glow-forest lg:scale-[1.03]"
          : "gradient-border-light bg-white text-charcoal",
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
        <h3 className={cn("font-heading font-bold text-xl mb-2", popular ? "text-white" : "text-forest")}>{pkg.name}</h3>
        <p className={cn("text-sm mb-6 min-h-10", popular ? "text-mint" : "text-charcoal/80")}>{pkg.audience}</p>

        <PackagePrice pkg={pkg} className={cn("mb-6", popular ? "text-white" : "text-forest")} />

        <div aria-hidden className={cn("h-px mb-6", popular ? "bg-sage/30" : "bg-sage/20")} />

        <ul className="space-y-3 mb-7">
          {features.map((feature) => (
            <li key={feature} className="flex gap-3 text-sm">
              <span
                className={cn(
                  "mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center",
                  popular ? "bg-mint/15 text-mint" : "bg-mint/50 text-forest",
                )}
              >
                <Check className="w-3 h-3" aria-hidden />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {!compact && (pkg.deliveryDays || pkg.revisions !== null) && (
          <dl className="grid grid-cols-2 gap-3 text-sm mb-7">
            {pkg.deliveryDays && (
              <div className={cn("rounded-xl px-3 py-2.5", popular ? "bg-forest-800/80" : "bg-neutral")}>
                <dt className={cn("flex items-center gap-1.5 text-xs font-medium", popular ? "text-mint" : "text-sage-600")}>
                  <Clock className="w-3.5 h-3.5" aria-hidden />
                  Delivery
                </dt>
                <dd className="font-semibold mt-0.5">{formatDelivery(pkg.deliveryDays)}</dd>
              </div>
            )}
            {pkg.revisions !== null && (
              <div className={cn("rounded-xl px-3 py-2.5", popular ? "bg-forest-800/80" : "bg-neutral")}>
                <dt className={cn("flex items-center gap-1.5 text-xs font-medium", popular ? "text-mint" : "text-sage-600")}>
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden />
                  Revisions
                </dt>
                <dd className="font-semibold mt-0.5">{pkg.revisions} rounds</dd>
              </div>
            )}
          </dl>
        )}

        <Link
          href={`/contact?package=${pkg.id}`}
          className={cn(
            "btn-shine group mt-auto inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-xl transition-colors",
            popular ? "bg-mint text-forest glow-mint" : "bg-forest text-neutral hover:bg-forest-700",
          )}
        >
          Get a quote<span className="sr-only"> for {pkg.name}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  )
}
