// Default prices, packages and payment terms. These seed the database and are
// used as-is when MONGODB_URI is not set. Once the database is connected,
// edit prices in /admin/pricing instead of here.
//
// TODO(Bilal): every number below is the PLACEHOLDER from the implementation
// plan. Confirm or replace each one before launch; do not publish unconfirmed.

import type { Currency, PricingContent, PricingPackage, PricingSettings } from "@/lib/content-schema"

export type { Currency, PricingPackage }

const buildNotIncluded = [
  "Domain name fee",
  "Copywriting and photography, unless added to the quote",
  "Third-party subscriptions and paid plugins",
]

export const defaultPackages: PricingPackage[] = [
  {
    id: "starter",
    name: "Starter Website",
    audience: "Small businesses that need a professional site, fast.",
    priceFrom: { PKR: 35000, USD: 299 },
    unit: "one-time",
    features: [
      "Up to 5 pages",
      "Mobile-first design",
      "WhatsApp chat button and contact form",
      "Google Maps location",
      "Basic SEO setup",
      "SSL and speed optimisation",
    ],
    deliveryDays: [7, 10],
    revisions: 2,
    notIncluded: buildNotIncluded,
  },
  {
    id: "business",
    name: "Business Website",
    audience: "Growing businesses that want more pages, a blog and bookings.",
    priceFrom: { PKR: 75000, USD: 699 },
    unit: "one-time",
    popular: true,
    features: [
      "Up to 10 pages",
      "Everything in Starter",
      "Blog you can update yourself",
      "Booking or enquiry forms",
      "Google Analytics setup",
      "Google Business Profile link-up",
    ],
    deliveryDays: [14, 21],
    revisions: 3,
    notIncluded: buildNotIncluded,
  },
  {
    id: "shopify",
    name: "Shopify Store",
    audience: "Shops and brands ready to sell online.",
    priceFrom: { PKR: 90000, USD: 899 },
    unit: "one-time",
    features: [
      "Store setup and theme customisation",
      "Up to 30 products uploaded",
      "Payments: COD, local gateways, Shopify Payments, PayPal",
      "Shipping and courier setup",
      "Essential apps installed and configured",
      "Mobile-first, speed-optimised store",
    ],
    deliveryDays: [14, 28],
    revisions: 3,
    notIncluded: ["Shopify plan fee", "Paid themes and paid apps", ...buildNotIncluded],
  },
  {
    id: "integrations",
    name: "Integrations",
    audience: "Connect your site to the tools you already use.",
    // TODO(Bilal): confirm the PKR prices of integrations and the AI assistant (set at roughly PKR 100 per $1).
    priceFrom: { PKR: 15000, USD: 149 },
    unit: "one-time",
    features: [
      "Payment gateways",
      "WhatsApp Business click-to-chat and API",
      "Booking: Calendly, Cal.com, Google Calendar",
      "CRM: HubSpot, Zoho",
      "Email: Resend, Mailchimp",
      "Google Business Profile",
    ],
    deliveryDays: null,
    revisions: null,
    notIncluded: ["Third-party subscription costs"],
  },
  {
    id: "ai-automation",
    name: "AI Chat Assistant",
    audience: "Answers customer questions instantly, so you don't have to.",
    priceFrom: { PKR: 25000, USD: 249 },
    unit: "one-time",
    features: [
      "Answers from your own info: menu, prices, hours",
      "On your website or WhatsApp",
      "Hands over to you when needed",
    ],
    deliveryDays: null,
    revisions: null,
    notIncluded: ["AI provider and automation tool subscriptions"],
  },
  {
    // TODO(Bilal): confirm the PKR prices of the three monthly plans (set at roughly PKR 100 per $1).
    id: "hosting",
    name: "Hosting only",
    audience: "First year included with every website we build.",
    priceFrom: { PKR: 1500, USD: 15 },
    unit: "monthly",
    features: ["Hosting for the site we built", "SSL certificate", "Regular backups", "Uptime monitoring"],
    deliveryDays: null,
    revisions: null,
    notIncluded: ["Domain renewal"],
  },
  {
    id: "care-basic",
    name: "Care Basic",
    audience: "Keep your site online, safe and up to date.",
    priceFrom: { PKR: 4000, USD: 39 },
    unit: "monthly",
    features: ["Everything in Hosting only", "Security and software updates", "A monthly check of your site"],
    deliveryDays: null,
    revisions: null,
    notIncluded: ["Domain renewal", "Shopify plan fee (Shopify hosts Shopify stores)"],
  },
  {
    id: "care-plus",
    name: "Care Plus",
    audience: "For businesses that update their site often.",
    priceFrom: { PKR: 8000, USD: 79 },
    unit: "monthly",
    features: ["Everything in Basic", "4 small edits a month", "Priority support"],
    deliveryDays: null,
    revisions: null,
    notIncluded: ["Domain renewal", "Shopify plan fee (Shopify hosts Shopify stores)"],
  },
]

export const findPackage = (packages: PricingPackage[], id: string) => packages.find((p) => p.id === id)

export const pickPackages = (packages: PricingPackage[], ids: string[]) =>
  ids.map((id) => findPackage(packages, id)).filter((p): p is PricingPackage => Boolean(p))

// Package groups are fixed in code because services and pages refer to these ids.
export const buildPackageIds = ["starter", "business", "shopify"]
export const customQuoteIds = ["integrations", "ai-automation"]
export const carePlanIds = ["hosting", "care-basic", "care-plus"]

export const defaultSettings: PricingSettings = {
  // TODO(Bilal): confirm payment terms and methods.
  paymentTerms: {
    split: "50% when you approve the mockup, 50% before launch",
    methods: {
      PKR: "Bank transfer",
      USD: "Payoneer, Wise or bank transfer",
    },
  },
  // How "hosting included" works, shown with the care plans.
  hostingNote:
    "The first year of hosting is free with any website we build. After that, Hosting only and both care plans include hosting with SSL. Shopify stores are hosted by Shopify on your Shopify plan.",
  priceFactors: ["Number of pages", "Number of products", "Custom features", "Integrations", "Content writing", "Rush delivery"],
  notIncludedAnywhere: [
    "Domain name fee",
    "Paid Shopify plan and paid apps",
    "Paid themes",
    "Copywriting or photography, unless added to your quote",
    "Third-party subscription costs",
  ],
}

export const defaultPricing: PricingContent = { packages: defaultPackages, settings: defaultSettings }

const numberFormat = new Intl.NumberFormat("en-US")

export function formatPrice(amount: number, currency: Currency) {
  return currency === "PKR" ? `PKR ${numberFormat.format(amount)}` : `$${numberFormat.format(amount)}`
}

// Add-on prices, shown under the build packages.
// TODO(Bilal): confirm the PKR amounts (set at roughly PKR 100 per $1).
export const extraPrices = {
  page: { PKR: 4000, USD: 40 },
  product: { PKR: 100, USD: 1 },
} satisfies Record<string, Record<Currency, number>>

// Rough pounds shown next to USD prices for UK visitors: to the nearest £5,
// or £1 under £100. Review the rate now and then.
const GBP_PER_USD = 0.79

export function aboutGbp(usd: number) {
  const gbp = usd * GBP_PER_USD
  return `about £${numberFormat.format(gbp < 100 ? Math.round(gbp) : Math.round(gbp / 5) * 5)}`
}

export function formatDelivery(days: [number, number]) {
  const [min, max] = days
  if (max < 14) return `${min}–${max} days`
  return `${Math.round(min / 7)}–${Math.round(max / 7)} weeks`
}
