"use client"

import { cn } from "@/lib/utils"
import { aboutGbp, extraPrices, formatPrice, type Currency, type PricingPackage } from "@/data/pricing"
import { useVisitor } from "@/components/visitor-provider"

// UK visitors see USD prices with a rough pounds figure next to them.
function useShowGbp() {
  const { currency, country } = useVisitor()
  return currency === "USD" && country === "GB"
}

export function PackagePrice({ pkg, className }: { pkg: PricingPackage; className?: string }) {
  const { currency } = useVisitor()
  const showGbp = useShowGbp()
  const amount = pkg.priceFrom[currency]
  const usd = pkg.priceFrom.USD

  if (amount === null) {
    return <p className={cn("font-heading font-bold text-3xl", className)}>Custom quote</p>
  }

  return (
    <p className={className}>
      <span className="block text-sm font-medium opacity-80">Starting from</span>
      <span className="font-heading font-bold text-4xl tracking-tight">{formatPrice(amount, currency)}</span>
      {pkg.unit === "monthly" && <span className="text-base font-medium"> /month</span>}
      {showGbp && usd !== null && <span className="text-base font-medium opacity-80"> ({aboutGbp(usd)})</span>}
    </p>
  )
}

// Lowest "starting from" price across a set of packages, e.g. for a service.
export function StartingFrom({ packages, className }: { packages: PricingPackage[]; className?: string }) {
  const { currency } = useVisitor()
  const showGbp = useShowGbp()
  const amounts = packages.map((p) => p.priceFrom[currency]).filter((a): a is number => a !== null)

  if (amounts.length === 0) return <span className={className}>Custom quote</span>

  const monthly = packages.every((p) => p.unit === "monthly")
  return (
    <span className={className}>
      From {formatPrice(Math.min(...amounts), currency)}
      {monthly && "/month"}
      {showGbp && <span className="text-[0.5em] font-medium opacity-80"> ({aboutGbp(Math.min(...amounts))})</span>}
    </span>
  )
}

export function ExtraPrices({ className }: { className?: string }) {
  const { currency } = useVisitor()
  const showGbp = useShowGbp()
  const price = (amounts: Record<Currency, number>) =>
    formatPrice(amounts[currency], currency) + (showGbp ? ` (${aboutGbp(amounts.USD)})` : "")

  return (
    <p className={className}>
      <strong className="text-forest">Extra pages:</strong> {price(extraPrices.page)} each.{" "}
      <strong className="text-forest">Extra Shopify products over 30:</strong> {price(extraPrices.product)} each, or free if you send
      them as a spreadsheet.
    </p>
  )
}

const options: { value: Currency; label: string }[] = [
  { value: "PKR", label: "Pakistan (PKR)" },
  { value: "USD", label: "International (USD)" },
]

export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency } = useVisitor()

  return (
    <div
      role="group"
      aria-label="Currency"
      className={cn("relative inline-grid grid-cols-2 rounded-2xl border border-sage/30 p-1 bg-white shadow-sm", className)}
    >
      {/* Sliding highlight behind the active option. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-forest transition-transform duration-300 ease-out",
          currency === "USD" && "translate-x-full",
        )}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={currency === option.value}
          onClick={() => setCurrency(option.value)}
          className={cn(
            "relative z-10 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300",
            currency === option.value ? "text-neutral" : "text-forest",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
