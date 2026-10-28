"use client"

import { cn } from "@/lib/utils"
import { formatPrice, type Currency, type PricingPackage } from "@/data/pricing"
import { useVisitor } from "@/components/visitor-provider"

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
export function StartingFrom({ packages, className }: { packages: PricingPackage[]; className?: string }) {
  const { currency } = useVisitor()
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
