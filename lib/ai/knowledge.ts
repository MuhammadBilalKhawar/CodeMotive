import { siteConfig } from "@/config/site"
import { services as codeServices, type Service } from "@/data/services"
import { formatDelivery, formatPrice, pickPackages } from "@/data/pricing"
import { visibleProjects } from "@/data/projects"
import type { PricingContent, PricingPackage, Project } from "@/lib/content-schema"
import type { AiSettings, TeamContent } from "@/lib/cms/schemas"
import { defaultAi, defaultFaqs, defaultSite, defaultTeam } from "@/lib/cms/defaults"
import { siteInfo, type SiteInfo } from "@/lib/cms/site-info"
import { fillFaqs, type FilledFaqs } from "@/lib/cms/faqs"

// Builds the plain-text COMPANY FACTS block for the AI reply from the same
// data the website renders, so a price changed in the admin reaches the AI
// automatically. Kept compact (well under ~2,500 tokens).

const priceLine = (pkg: PricingPackage) => {
  const unit = pkg.unit === "monthly" ? " per month" : ""
  const { PKR, USD } = pkg.priceFrom
  if (PKR === null && USD === null) return "custom quote (no published price)"
  const parts = [PKR !== null && `${formatPrice(PKR, "PKR")}${unit}`, USD !== null && `${formatPrice(USD, "USD")}${unit}`].filter(Boolean)
  return `starting from ${parts.join(" / ")}`
}

// Everything except pricing and projects is optional and falls back to the
// defaults, so tests can build facts without the CMS.
type FactsInput = {
  pricing: PricingContent
  projects: Project[]
  site?: SiteInfo
  team?: TeamContent
  services?: Service[]
  faqs?: FilledFaqs
  ai?: AiSettings
}

export function buildCompanyFacts({
  pricing,
  projects,
  site = siteInfo(defaultSite),
  team = defaultTeam,
  services = codeServices,
  faqs = fillFaqs(defaultFaqs, site, pricing.settings),
  ai = defaultAi,
}: FactsInput) {
  const { packages, settings } = pricing
  const lines: string[] = []
  const days = `${site.mockupDays} working day${site.mockupDays === 1 ? "" : "s"}`

  lines.push(
    `COMPANY: ${siteConfig.name} (${site.tagline}). ${site.summary}`,
    `Location: ${site.fullAddress}. Works with clients in Pakistan and internationally (remote: WhatsApp, email, video calls).`,
    `Contact: email ${site.email}, WhatsApp ${site.whatsappDisplay}. ${site.replyPromise}`,
    `Founders: ${team.map((f) => `${f.name}, ${f.role}, ${f.experience} (${f.skills.join(", ")})`).join("; ")}.`,
    `Delivery: ${site.deliveryPromise} Every project gets a written fixed quote with scope, price and timeline before work starts. Weekly progress updates.`,
    "",
    "SERVICES:",
  )
  for (const service of services) {
    const prices = pickPackages(packages, service.packageIds)
    const published = prices.filter((p) => p.priceFrom.PKR !== null || p.priceFrom.USD !== null)
    lines.push(
      `- ${service.name}: ${service.short} Includes: ${service.included.join("; ")}. Timeline: ${service.timeline}` +
        (published.length ? "" : " Price: custom quote after a free call."),
    )
  }

  lines.push("", "PACKAGES AND STARTING PRICES (PKR for Pakistan, USD for everyone else):")
  for (const pkg of packages) {
    const customQuote = pkg.priceFrom.PKR === null && pkg.priceFrom.USD === null
    // Custom-quote packages repeat their service's list above, so keep them short.
    if (customQuote) {
      lines.push(`- ${pkg.name}: ${priceLine(pkg)}.`)
      continue
    }
    const delivery = pkg.deliveryDays ? ` Delivery ${formatDelivery(pkg.deliveryDays)}.` : ""
    const revisions = pkg.revisions !== null ? ` ${pkg.revisions} revision rounds.` : ""
    lines.push(
      `- ${pkg.name}: ${priceLine(pkg)}. For: ${pkg.audience} Includes: ${pkg.features.join("; ")}.${delivery}${revisions}` +
        (pkg.notIncluded.length ? ` Not included: ${pkg.notIncluded.join("; ")}.` : ""),
    )
  }

  lines.push(
    "",
    `PAYMENT: ${settings.paymentTerms.split}. Pakistan (PKR): ${settings.paymentTerms.methods.PKR}. International (USD): ${settings.paymentTerms.methods.USD}.`,
    `HOSTING: ${settings.hostingNote}`,
    `WHAT AFFECTS THE PRICE: ${settings.priceFactors.join("; ")}.`,
    `NOT INCLUDED IN ANY PACKAGE: ${settings.notIncludedAnywhere.join("; ")}.`,
    `FREE HOMEPAGE MOCKUP: businesses can request a free homepage mockup at ${siteConfig.url}/free-mockup; delivered within ${days}, no obligation.`,
  )
  if (ai.notOffered.length) {
    lines.push(`NOT OFFERED RIGHT NOW: ${ai.notOffered.join("; ")}. Every website and store we build is mobile-first and works well on phones.`)
  }
  if (ai.extraFacts.length) {
    lines.push("", "OTHER FACTS:", ...ai.extraFacts.map((fact) => `- ${fact}`))
  }

  const shown = visibleProjects(projects)
  if (shown.length) {
    lines.push("", "PORTFOLIO (only mention these, with their exact labels):")
    for (const p of shown) {
      const link = p.status === "live" && p.liveUrl ? ` ${p.liveUrl}` : ""
      const status = p.status === "in-development" ? ", in development" : ""
      lines.push(`- ${p.title} (${p.type}${status}, ${p.industry}): ${p.summary}${p.stack.length ? ` Stack: ${p.stack.join(", ")}.` : ""}${link}`)
    }
  }

  lines.push("", "FAQ:")
  for (const faq of [...faqs.general, ...faqs.pricing]) {
    lines.push(`Q: ${faq.question} A: ${faq.answer}`)
  }

  return lines.join("\n")
}

// Every money amount that may appear in a reply, per currency.
export function allowedPrices(pricing: PricingContent) {
  const allowed = { PKR: new Set<number>(), USD: new Set<number>() }
  for (const pkg of pricing.packages) {
    if (pkg.priceFrom.PKR !== null) allowed.PKR.add(pkg.priceFrom.PKR)
    if (pkg.priceFrom.USD !== null) allowed.USD.add(pkg.priceFrom.USD)
  }
  return allowed
}
