// UK (GBP) pricing. The single source for every pound figure and every word of
// UK pricing copy on the site: the pricing page, the home page, service cards,
// the AI chat and /llms.txt all read from here. Nothing is hard-coded in
// components. PKR and USD prices stay in data/pricing.ts.

import type { Currency } from "@/data/pricing"

// The market a visitor is looking at. GBP is the UK market.
export type Market = Currency | "GBP"

// Off by default. When true, the pricing sections show a small launch banner.
export const SHOW_LAUNCH_OFFER = false
export const launchOfferText = "Launch offer for our first 5 UK clients: about 20% off in exchange for a short testimonial."

const numberFormat = new Intl.NumberFormat("en-GB")
export const formatGbp = (amount: number) => `£${numberFormat.format(amount)}`

export type UkOffer = {
  id: string
  name: string
  from: number
  unit: "one-time" | "monthly"
  // True when the price is a "from" price; care plans are fixed monthly prices.
  isFrom: boolean
  popular?: boolean
  includes: string[]
  // Shown after the "Raises the price:" label.
  raisesPrice?: string
  // Row on the plan card, e.g. the delivery line.
  delivery?: string
  // Package id the contact form understands (/contact?package=<id>), so the
  // existing quote link pre-selects the right service.
  contactPackage: string
}

export const extraPagePrice = 60

const upToTwoWeeks = "Up to 2 weeks, then 1 week of revisions"

export const ukPlans: UkOffer[] = [
  {
    id: "starter",
    name: "Starter",
    from: 595,
    unit: "one-time",
    isFrom: true,
    includes: [
      "Up to 5 pages",
      "Mobile-first design",
      "Enquiry form",
      "WhatsApp or contact button",
      "Google Maps location",
      "Hosting and domain setup",
    ],
    raisesPrice: `Extra pages (${formatGbp(extraPagePrice)} each)`,
    delivery: upToTwoWeeks,
    contactPackage: "starter",
  },
  {
    id: "ordering",
    name: "Online Ordering Site",
    from: 795,
    unit: "one-time",
    isFrom: true,
    includes: ["Fixed template", "Order enquiry form", "Gallery", "Mobile-first design", "Hosting and domain setup"],
    raisesPrice: "Extra pages; custom order fields",
    delivery: upToTwoWeeks,
    contactPackage: "starter",
  },
  {
    id: "business",
    name: "Business",
    from: 1095,
    unit: "one-time",
    isFrom: true,
    popular: true,
    includes: ["Up to 10 pages", "A blog you can update yourself", "Booking or enquiry forms", "Hosting and domain setup"],
    raisesPrice: "Extra pages; extra forms",
    delivery: upToTwoWeeks,
    contactPackage: "business",
  },
  {
    id: "shopify",
    name: "Shopify Store",
    from: 1495,
    unit: "one-time",
    isFrom: true,
    includes: [
      "Store setup and theme customisation",
      "Up to 30 products",
      "Payments (Stripe, Shopify Payments)",
      "UK shipping and VAT setup",
    ],
    raisesPrice: "Extra products; custom features",
    delivery: "Timeline agreed in your quote",
    contactPackage: "shopify",
  },
]

export const ukExtras: UkOffer[] = [
  {
    id: "integrations",
    name: "Integrations",
    from: 195,
    unit: "one-time",
    isFrom: true,
    includes: ["WhatsApp", "Booking", "CRM", "Email", "Google Business Profile"],
    contactPackage: "integrations",
  },
  {
    id: "ai-automation",
    name: "AI automation and chatbots",
    from: 395,
    unit: "one-time",
    isFrom: true,
    includes: [],
    contactPackage: "ai-automation",
  },
]

export const ukCustomProject = {
  name: "Custom projects",
  from: 1500,
  note: "quoted after a complete discussion of your project",
}

// Optional monthly plans. They run on the client's own hosting.
export const ukCarePlans: UkOffer[] = [
  {
    id: "care-basic",
    name: "Basic",
    from: 29,
    unit: "monthly",
    isFrom: false,
    includes: ["Monitoring", "Backups", "Security updates", "Uptime checks"],
    contactPackage: "care-basic",
  },
  {
    id: "care-standard",
    name: "Standard",
    from: 49,
    unit: "monthly",
    isFrom: false,
    includes: ["Everything in Basic", "Small monthly edits"],
    // The contact form has a single "Care plan" service; Standard and Growth map to it.
    contactPackage: "care-plus",
  },
  {
    id: "care-growth",
    name: "Growth",
    from: 79,
    unit: "monthly",
    isFrom: false,
    includes: ["Everything in Standard", "More edit time", "Priority support"],
    contactPackage: "care-plus",
  },
]

export const ukCareNote = "Optional monthly plans that run on your own hosting. Annual payment discounts are available."

export const raisesPriceLabel = "Raises the price:"
export const ukCtaLabel = "Get a free mockup"

// Shown under the plans, in this order.
export const ukTerms = [
  "The homepage mockup is free. No payment until you approve it.",
  "50% is due when you approve the mockup and 50% before launch.",
  "Websites are built in 2 weeks at most, often faster, counted from your first payment. After that comes 1 week of revisions. Shopify stores and custom projects have their timeline agreed in your quote.",
  "Changes after the revision week are quoted separately or can be covered by a care plan.",
  "Payments are non-refundable once the build starts.",
  "You buy your domain and hosting in your own name and pay the provider directly. We handle the setup. You own your site, domain and hosting accounts.",
  "Prices are in GBP. Pay through Payoneer, or by Taptap Send to our PKR bank account. We give a fixed quote after a complete discussion of your project.",
]

// The "from" price shown for each service, and which UK plans fill its page.
export const ukServices: Record<string, { from: number; unit: "one-time" | "monthly"; offers: UkOffer[] }> = {
  websites: { from: 595, unit: "one-time", offers: ukPlans.filter((p) => p.id !== "shopify") },
  shopify: { from: 1495, unit: "one-time", offers: ukPlans.filter((p) => p.id === "shopify") },
  integrations: { from: 195, unit: "one-time", offers: ukExtras.filter((p) => p.id === "integrations") },
  "ai-automation": { from: 395, unit: "one-time", offers: ukExtras.filter((p) => p.id === "ai-automation") },
  "care-plans": { from: 29, unit: "monthly", offers: ukCarePlans },
}

export const ukServiceFrom = (slug: string) => {
  const service = ukServices[slug]
  return service ? `From ${formatGbp(service.from)}${service.unit === "monthly" ? "/month" : ""}` : null
}

export const ukPriceText = (offer: UkOffer) =>
  `${offer.isFrom ? "from " : ""}${formatGbp(offer.from)}${offer.unit === "monthly" ? "/month" : ""}`

// Every pound amount that may appear in an AI reply.
export const ukAllowedPrices = () =>
  new Set<number>([
    ...[...ukPlans, ...ukExtras, ...ukCarePlans].map((o) => o.from),
    ukCustomProject.from,
    extraPagePrice,
  ])

// Plain-text lines for the AI chat facts and /llms.txt, built from the data above.
export function ukPricingLines() {
  const offer = (o: UkOffer) =>
    `- ${o.name}: ${ukPriceText(o)}. Includes: ${o.includes.join("; ")}.` +
    (o.raisesPrice ? ` ${raisesPriceLabel} ${o.raisesPrice}.` : "") +
    (o.delivery ? ` ${o.delivery}.` : "")
  return [
    "UK PRICING (GBP, all 'from' prices unless stated):",
    "Website packages:",
    ...ukPlans.map(offer),
    "Extras:",
    ...ukExtras.map(offer),
    `- ${ukCustomProject.name}: from ${formatGbp(ukCustomProject.from)}, ${ukCustomProject.note}.`,
    `Care plans (${ukCareNote}):`,
    ...ukCarePlans.map(offer),
    "UK terms:",
    ...ukTerms.map((term, i) => `${i + 1}. ${term}`),
  ]
}
