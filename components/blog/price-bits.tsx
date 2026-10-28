import { findPackage, formatDelivery, formatPrice } from "@/data/pricing"
import type { PricingContent } from "@/lib/content-schema"

// Small helpers so blog posts quote the live prices from the admin.

export function priceOf(pricing: PricingContent, id: string, currency: "PKR" | "USD" = "PKR") {
  const amount = findPackage(pricing.packages, id)?.priceFrom[currency]
  return amount === null || amount === undefined ? "a custom quote" : formatPrice(amount, currency)
}

export function deliveryOf(pricing: PricingContent, id: string) {
  const days = findPackage(pricing.packages, id)?.deliveryDays
  return days ? formatDelivery(days) : "a timeline set in your quote"
}

// Package comparison table for the given ids, in both currencies.
export function PriceTable({ pricing, ids }: { pricing: PricingContent; ids: string[] }) {
  const rows = ids.map((id) => findPackage(pricing.packages, id)).filter((p) => p !== undefined)
  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Pakistan</th>
            <th scope="col">International</th>
            <th scope="col">Best for</th>
            <th scope="col">Typical delivery</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pkg) => {
            const per = pkg.unit === "monthly" ? "/month" : ""
            const price = (c: "PKR" | "USD") => (pkg.priceFrom[c] === null ? "Custom quote" : `from ${formatPrice(pkg.priceFrom[c]!, c)}${per}`)
            return (
              <tr key={pkg.id}>
                <th scope="row">{pkg.name}</th>
                <td>{price("PKR")}</td>
                <td>{price("USD")}</td>
                <td>{pkg.audience}</td>
                <td>{pkg.deliveryDays ? formatDelivery(pkg.deliveryDays) : "Set in your quote"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
