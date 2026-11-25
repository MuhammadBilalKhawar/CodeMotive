"use client"

import { cn } from "@/lib/utils"
import { extraPrices, formatPrice, type Currency, type PricingPackage } from "@/data/pricing"
import { ukServiceFrom, type Market } from "@/data/pricing-uk"
import { useVisitor } from "@/components/visitor-provider"

// Shows `gbp` in the UK market and `children` (the PKR/USD content) otherwise.
// Both are rendered on the server and passed in, so this only picks one.
export function MarketSwitch({ gbp, children }: { gbp: React.ReactNode; children: React.ReactNode }) {
  const { market } = useVisitor()
  return <>{market === "GBP" ? gbp : children}</>
}

export function PackagePrice({ pkg, className }: { pkg: PricingPackage; className?: string }) {
  const { currency } = useVisitor()
  const amount = pkg.priceFrom[currency]

  if (amount === null) {
    return <p className={cn("font-heading font-bold text-3xl", className)}>Custom quote</p>
  }

  return (
    <p className={className}>
      <span className="block text-sm font-medium opacity-80">Starting from</span>
      <span className="font-heading font-bold text-4xl tracking-tight">{formatPrice(amount, currency)}</span>
      {pkg.unit === "monthly" && <span className="text-base font-medium"> /month</span>}
    </p>
  )
}

// Lowest "starting from" price across a set of packages, e.g. for a service.
// In the UK market, pass the service slug to show its GBP "from" price.
export function StartingFrom({
  packages,
  serviceSlug,
  className,
}: {
  packages: PricingPackage[]
  serviceSlug?: string
  className?: string
}) {
  const { currency, market } = useVisitor()
  const gbp = market === "GBP" && serviceSlug ? ukServiceFrom(serviceSlug) : null
  if (gbp) return <span className={className}>{gbp}</span>
  const amounts = packages.map((p) => p.priceFrom[currency]).filter((a): a is number => a !== null)

  if (amounts.length === 0) return <span className={className}>Custom quote</span>

  const monthly = packages.every((p) => p.unit === "monthly")
  return (
    <span className={className}>
      From {formatPrice(Math.min(...amounts), currency)}
      {monthly && "/month"}
    </span>
  )
}

export function ExtraPrices({ className }: { className?: string }) {
  const { currency } = useVisitor()
  const price = (amounts: Record<Currency, number>) => formatPrice(amounts[currency], currency)

  return (
    <p className={className}>
      <strong className="text-forest">Extra pages:</strong> {price(extraPrices.page)} each.{" "}
      <strong className="text-forest">Extra Shopify products over 30:</strong> {price(extraPrices.product)} each, or free if you send
      them as a spreadsheet.
    </p>
  )
}

const options: { value: Market; label: string; short: string }[] = [
  { value: "PKR", label: "Pakistan (PKR)", short: "PKR" },
  { value: "USD", label: "International (USD)", short: "USD" },
  { value: "GBP", label: "United Kingdom (GBP)", short: "GBP" },
]

// Three equal columns, so the highlight moves by whole columns and nothing
// shifts when the market changes. Short labels on phones keep it on one line.
export function CurrencyToggle({ className }: { className?: string }) {
  const { market, setMarket } = useVisitor()
  const index = options.findIndex((o) => o.value === market)

  return (
    <div
      role="group"
      aria-label="Market and currency"
      className={cn(
        "relative inline-grid w-full max-w-md grid-cols-3 rounded-2xl border border-sage/30 p-1 bg-white shadow-sm sm:w-auto sm:max-w-none",
        className,
      )}
    >
      {/* Sliding highlight behind the active option. */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-forest transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={market === option.value}
          aria-label={option.label}
          onClick={() => setMarket(option.value)}
          className={cn(
            "relative z-10 px-2 py-2.5 sm:px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600",
            market === option.value ? "text-neutral" : "text-forest",
          )}
        >
          <span aria-hidden className="sm:hidden">
            {option.short}
          </span>
          <span aria-hidden className="hidden sm:inline">
            {option.label}
          </span>
        </button>
      ))}
    </div>
  )
}
