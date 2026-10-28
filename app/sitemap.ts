import type { MetadataRoute } from "next"
import { services } from "@/data/services"
import { industries } from "@/data/industries"
import { getPublishedPosts } from "@/lib/cms"
import { getContentUpdatedAt } from "@/lib/content"
import { absoluteUrl } from "@/lib/seo"

// Built from the route list, so new pages appear automatically. lastmod uses
// real dates where we have them: when prices or projects were last saved in
// the admin, the guide's update date, or the legal pages' "last updated" date.
// Slugs come from the code; only their text is editable.
// /free-mockup (outreach only) and /admin are left out on purpose.

const PRIVACY_UPDATED = new Date("2026-10-28")
const TERMS_UPDATED = new Date("2026-10-24")
const SITE_UPDATED = new Date("2026-10-25")

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let updated: Record<string, Date> = {}
  try {
    updated = await getContentUpdatedAt()
  } catch (error) {
    console.error("[sitemap] Couldn't read content dates", error)
  }
  const pricingDate = updated.pricing ?? SITE_UPDATED
  const projectsDate = updated.projects ?? SITE_UPDATED
  const latest = (...dates: Date[]) => new Date(Math.max(...dates.map((d) => d.getTime())))

  const posts = await getPublishedPosts()
  const page = (path: string, lastModified: Date, priority: number): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    lastModified,
    priority,
  })

  return [
    page("/", latest(pricingDate, projectsDate), 1),
    page("/services", pricingDate, 0.9),
    ...services.map((s) => page(`/services/${s.slug}`, latest(pricingDate, projectsDate), 0.9)),
    page("/pricing", pricingDate, 0.9),
    page("/industries", SITE_UPDATED, 0.7),
    ...industries.map((i) => page(`/industries/${i.slug}`, latest(pricingDate, projectsDate), 0.8)),
    page("/work", projectsDate, 0.7),
    ...(posts.length ? [page("/blog", new Date(posts[0].dateUpdated), 0.6)] : []),
    ...posts.map((p) => page(`/blog/${p.slug}`, new Date(p.dateUpdated), 0.6)),
    page("/about", SITE_UPDATED, 0.6),
    page("/contact", SITE_UPDATED, 0.7),
    page("/privacy", PRIVACY_UPDATED, 0.2),
    page("/terms", TERMS_UPDATED, 0.2),
  ]
}
