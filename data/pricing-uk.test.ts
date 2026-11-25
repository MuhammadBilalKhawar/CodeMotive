import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  SHOW_LAUNCH_OFFER,
  ukAllowedPrices,
  ukCareNote,
  ukCarePlans,
  ukCustomProject,
  ukExtras,
  ukPlans,
  ukPricingLines,
  ukServiceFrom,
  ukTerms,
} from "@/data/pricing-uk"
import { defaultPricing } from "@/data/pricing"
import { defaultProjects } from "@/data/projects"
import { allowedPrices, buildCompanyFacts } from "@/lib/ai/knowledge"
import { extractMoney, isReplySafe } from "@/lib/ai/safety"
import { GET as llmsTxt } from "@/app/llms.txt/route"

// These literals are the written UK pricing spec, kept separate from the data
// file on purpose: if either side drifts, this fails.
const specPlans = [
  { name: "Starter", from: 595, includes: ["Up to 5 pages", "Mobile-first design", "Enquiry form", "WhatsApp or contact button", "Google Maps location", "Hosting and domain setup"], raises: "Extra pages (£60 each)", delivery: "Up to 2 weeks, then 1 week of revisions" },
  { name: "Online Ordering Site", from: 795, includes: ["Fixed template", "Order enquiry form", "Gallery", "Mobile-first design", "Hosting and domain setup"], raises: "Extra pages; custom order fields", delivery: "Up to 2 weeks, then 1 week of revisions" },
  { name: "Business", from: 1095, popular: true, includes: ["Up to 10 pages", "A blog you can update yourself", "Booking or enquiry forms", "Hosting and domain setup"], raises: "Extra pages; extra forms", delivery: "Up to 2 weeks, then 1 week of revisions" },
  { name: "Shopify Store", from: 1495, includes: ["Store setup and theme customisation", "Up to 30 products", "Payments (Stripe, Shopify Payments)", "UK shipping and VAT setup"], raises: "Extra products; custom features", delivery: "Timeline agreed in your quote" },
]
const specExtras = [
  { name: "Integrations", from: 195 },
  { name: "AI automation and chatbots", from: 395 },
]
const specCare = [
  { name: "Basic", from: 29, includes: ["Monitoring", "Backups", "Security updates", "Uptime checks"] },
  { name: "Standard", from: 49, includes: ["Everything in Basic", "Small monthly edits"] },
  { name: "Growth", from: 79, includes: ["Everything in Standard", "More edit time", "Priority support"] },
]
const specTerms = [
  "The homepage mockup is free. No payment until you approve it.",
  "50% is due when you approve the mockup and 50% before launch.",
  "Websites are built in 2 weeks at most, often faster, counted from your first payment. After that comes 1 week of revisions. Shopify stores and custom projects have their timeline agreed in your quote.",
  "Changes after the revision week are quoted separately or can be covered by a care plan.",
  "Payments are non-refundable once the build starts.",
  "You buy your domain and hosting in your own name and pay the provider directly. We handle the setup. You own your site, domain and hosting accounts.",
  "Prices are in GBP. Pay through Payoneer, or by Taptap Send to our PKR bank account. We give a fixed quote after a complete discussion of your project.",
]

describe("UK pricing data matches the spec", () => {
  it("has the four website plans", () => {
    expect(
      ukPlans.map((p) => ({ name: p.name, from: p.from, ...(p.popular && { popular: true }), includes: p.includes, raises: p.raisesPrice, delivery: p.delivery })),
    ).toEqual(specPlans)
    expect(ukPlans.every((p) => p.unit === "one-time" && p.isFrom)).toBe(true)
  })

  it("has the extras and the custom projects line", () => {
    expect(ukExtras.map((e) => ({ name: e.name, from: e.from }))).toEqual(specExtras)
    expect(ukCustomProject).toEqual({ name: "Custom projects", from: 1500, note: "quoted after a complete discussion of your project" })
  })

  it("has the three monthly care plans", () => {
    expect(ukCarePlans.map((p) => ({ name: p.name, from: p.from, includes: p.includes }))).toEqual(specCare)
    expect(ukCarePlans.every((p) => p.unit === "monthly" && !p.isFrom)).toBe(true)
    expect(ukCareNote).toContain("Annual payment discounts are available.")
    expect(ukCareNote).not.toMatch(/\d\s?%/)
  })

  it("has exactly the seven terms, in order", () => {
    expect(ukTerms).toEqual(specTerms)
    expect(ukTerms[6]).toBe(
      "Prices are in GBP. Pay through Payoneer, or by Taptap Send to our PKR bank account. We give a fixed quote after a complete discussion of your project.",
    )
  })

  it("maps each service to its 'from' price", () => {
    expect(ukServiceFrom("websites")).toBe("From £595")
    expect(ukServiceFrom("shopify")).toBe("From £1,495")
    expect(ukServiceFrom("integrations")).toBe("From £195")
    expect(ukServiceFrom("ai-automation")).toBe("From £395")
    expect(ukServiceFrom("care-plans")).toBe("From £29/month")
  })

  it("keeps the launch offer off", () => {
    expect(SHOW_LAUNCH_OFFER).toBe(false)
  })

  it("removes 'delivered in days' from the ordering site", () => {
    expect(JSON.stringify(ukPlans)).not.toMatch(/delivered in days/i)
  })
})

describe("AI chat and /llms.txt read the same UK data", () => {
  const facts = buildCompanyFacts({ pricing: defaultPricing, projects: defaultProjects, market: "GBP" })
  const llms = llmsTxt().then((res) => res.text())

  const mustContain = [
    ...specPlans.flatMap((p) => [`${p.name}: from £${p.from.toLocaleString("en-GB")}`, p.delivery]),
    ...specExtras.map((e) => `${e.name}: from £${e.from}`),
    "Custom projects: from £1,500, quoted after a complete discussion of your project",
    ...specCare.map((c) => `${c.name}: £${c.from}/month`),
    ...specTerms,
  ]

  it("UK chat facts contain every UK figure and all seven terms", () => {
    for (const text of mustContain) expect(facts, text).toContain(text)
  })

  it("UK chat facts leave out the PKR/USD pricing and terms", () => {
    expect(facts).not.toMatch(/PKR\s?\d|\$\d|Payoneer, Wise or bank transfer|first year of hosting is free|PACKAGES AND STARTING PRICES|no lock-in/i)
  })

  it("/llms.txt has a GBP section with every UK figure and all seven terms", async () => {
    const text = await llms
    const section = text.slice(text.indexOf("## UK pricing (GBP)"), text.indexOf("## Industries"))
    expect(section.length).toBeGreaterThan(200)
    for (const line of mustContain) expect(section, line).toContain(line)
    // The section is the same text the chat gets.
    for (const line of ukPricingLines()) expect(section).toContain(line)
  })

  it("the UK allowed-price set matches the data and the safety check accepts it", () => {
    const allowed = allowedPrices(defaultPricing)
    expect([...allowed.GBP].sort((a, b) => a - b)).toEqual([...ukAllowedPrices()].sort((a, b) => a - b))
    expect(extractMoney("Starter is from £595 and Shopify from £1,495.")).toEqual([
      { currency: "GBP", amount: 595 },
      { currency: "GBP", amount: 1495 },
    ])
    expect(isReplySafe("The Starter plan is from £595.", allowed, facts)).toBe(true)
    expect(isReplySafe("The Starter plan is from £300.", allowed, facts)).toBe(false)
  })
})

describe("wording rules", () => {
  const ukCopy = () =>
    JSON.stringify([ukPlans, ukExtras, ukCustomProject, ukCarePlans, ukCareNote, ukTerms, ukPricingLines()])

  it("never uses the word 'call' in GBP-mode pricing copy", async () => {
    const facts = buildCompanyFacts({ pricing: defaultPricing, projects: defaultProjects, market: "GBP" })
    const llms = await (await llmsTxt()).text()
    const llmsUk = llms.slice(llms.indexOf("## UK pricing (GBP)"), llms.indexOf("## Industries"))
    // The UK block of the chat facts runs from the UK pricing header to the free-mockup line.
    const chatUk = facts.slice(facts.indexOf("UK PRICING"), facts.indexOf("FREE HOMEPAGE MOCKUP"))
    for (const text of [ukCopy(), llmsUk, chatUk]) expect(text).not.toMatch(/\bcalls?\b/i)
  })

  it("never mentions bakeries or cakes on the public site", () => {
    const roots = ["app", "components", "data", "lib", "config", "public"]
    const skip = new Set(["node_modules", ".next", "fonts"])
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (skip.has(name)) continue
        const file = path.join(dir, name)
        if (statSync(file).isDirectory()) walk(file)
        else if (/\.(tsx?|json|txt|md|xml|webmanifest|svg)$/.test(name) && !/\.test\.tsx?$/.test(name)) {
          if (/bakery|bakeries|cake/i.test(readFileSync(file, "utf8"))) hits.push(file)
        }
      }
    }
    for (const root of roots) walk(path.join(process.cwd(), root))
    expect(hits).toEqual([])
  })

  it("has no bank details, account numbers or payment links in UK copy", () => {
    expect(ukCopy()).not.toMatch(/https?:\/\/|IBAN|account (number|no)|sort code|\b\d{10,}\b/i)
  })

  it("names no individual person in UK copy", () => {
    expect(ukCopy()).not.toMatch(/bilal|ahmad/i)
  })
})
