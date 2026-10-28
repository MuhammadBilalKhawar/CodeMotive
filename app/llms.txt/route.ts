import { siteConfig } from "@/config/site"
import { formatDelivery, formatPrice, pickPackages } from "@/data/pricing"
import { visibleProjects } from "@/data/projects"
import { getPricing, getProjects } from "@/lib/content"
import { getAiSettings, getIndustries, getPublishedPosts, getServices, getSite } from "@/lib/cms"
import { absoluteUrl } from "@/lib/seo"
import type { PricingPackage } from "@/lib/content-schema"

// /llms.txt: a plain summary for AI assistants, built from the same data as
// the site, so prices and services never contradict the pages. Static, and
// refreshed when prices or projects are saved in the admin.
export const dynamic = "force-static"

const price = (pkg: PricingPackage) => {
  const per = pkg.unit === "monthly" ? "/month" : ""
  const parts = (["PKR", "USD"] as const).filter((c) => pkg.priceFrom[c] !== null).map((c) => `${formatPrice(pkg.priceFrom[c]!, c)}${per}`)
  return parts.length ? `from ${parts.join(" / ")}` : "custom quote"
}

export async function GET() {
  const [{ packages, settings }, projects, site, services, industries, posts, ai] = await Promise.all([
    getPricing(),
    getProjects(),
    getSite(),
    getServices(),
    getIndustries(),
    getPublishedPosts(),
    getAiSettings(),
  ])
  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${site.summary}`,
    "",
    `${siteConfig.name} (${site.tagline}) is based in ${site.fullAddress} and works with clients in Pakistan and worldwide, remotely over WhatsApp, email and video calls. Every project gets a fixed written quote with scope, price and timeline before work starts. ${site.deliveryPromise} Prices are in PKR for Pakistan and USD for international clients.`,
    "",
    "## Services",
    "",
    ...services.map((s) => {
      const pkgs = pickPackages(packages, s.packageIds)
      const from = pkgs.some((p) => p.priceFrom.PKR !== null || p.priceFrom.USD !== null) ? ` Starting prices: ${pkgs.map((p) => `${p.name} ${price(p)}`).join("; ")}.` : " Custom quote after a free call."
      return `- [${s.name}](${absoluteUrl(`/services/${s.slug}`)}): ${s.short} ${s.timeline}${from}`
    }),
    "",
    "## Packages",
    "",
    ...packages.map((p) => {
      const delivery = p.deliveryDays ? ` Delivery ${formatDelivery(p.deliveryDays)}.` : ""
      return `- ${p.name} (${price(p)}): ${p.features.join("; ")}.${delivery}`
    }),
    "",
    `Payment: ${settings.paymentTerms.split}. Pakistan: ${settings.paymentTerms.methods.PKR}. International: ${settings.paymentTerms.methods.USD}.`,
    `Not included in any package: ${settings.notIncludedAnywhere.join("; ")}.`,
    ...(ai.notOffered.length ? [`Not offered right now: ${ai.notOffered.join("; ")}. All websites and stores are mobile-first.`] : []),
    `Full pricing: ${absoluteUrl("/pricing")}`,
    "",
    "## Industries",
    "",
    ...industries.map((i) => `- [${i.name}](${absoluteUrl(`/industries/${i.slug}`)})`),
  ]

  const work = visibleProjects(projects)
  if (work.length) {
    lines.push("", "## Work", "")
    for (const p of work) {
      const status = p.status === "in-development" ? ", in development" : ""
      const link = p.status === "live" && p.liveUrl ? ` ${p.liveUrl}` : ""
      lines.push(`- ${p.title} (${p.type}${status}, ${p.industry}, ${p.country}): ${p.summary}${link}`)
    }
  }

  if (posts.length) {
    lines.push("", "## Guides", "", ...posts.map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.description}`))
  }

  lines.push(
    "",
    "## Contact",
    "",
    `- Get a free quote: ${absoluteUrl("/contact")}`,
    `- Email: ${site.email}`,
    `- WhatsApp: ${site.whatsappDisplay} (${site.whatsappUrl})`,
    `- About the founders: ${absoluteUrl("/about")}`,
    `- ${site.replyPromise}`,
    "",
  )

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
