import { cache } from "react"
import { readContent, getPricing } from "@/lib/content"
import { contentRegistry, type ContentKey } from "@/lib/content-registry"
import { services as codeServices, type Service } from "@/data/services"
import { industries as codeIndustries, type Industry } from "@/data/industries"
import { posts } from "@/data/blog"
import { pageMetadata } from "@/lib/seo"
import { siteInfo } from "@/lib/cms/site-info"
import { fillFaqs, type FilledFaqs } from "@/lib/cms/faqs"
import { defaultGuides, defaultIndustriesText, defaultSeo, defaultServicesText } from "@/lib/cms/defaults"
import type {
  AiSettings,
  FaqContent,
  GuidesContent,
  HomeContent,
  IndustryText,
  SeoContent,
  ServiceText,
  SiteContent,
  TeamContent,
  TestimonialsContent,
} from "@/lib/cms/schemas"

// Read side of the website CMS: what's saved in the admin, or the defaults
// (taken from the code) when nothing has been saved. Cached per request.

type ContentMap = {
  site: SiteContent
  home: HomeContent
  services: ServiceText[]
  industries: IndustryText[]
  team: TeamContent
  testimonials: TestimonialsContent
  faq: FaqContent
  seo: SeoContent
  ai: AiSettings
  guides: GuidesContent
}

export const getContent = cache(<K extends ContentKey>(key: K): Promise<ContentMap[K]> => {
  const { schema, defaults } = contentRegistry[key]
  return readContent(key, schema, defaults) as Promise<ContentMap[K]>
})

export const getSite = cache(async () => siteInfo(await getContent("site")))
export const getHome = () => getContent("home")
export const getTeam = () => getContent("team")
export const getTestimonials = () => getContent("testimonials")
export const getAiSettings = () => getContent("ai")

// Code keeps the structure (slugs, icons, linked packages); the admin edits the text.
function mergeBySlug<T extends { slug: string }, U extends { slug: string }>(base: T[], text: U[]): T[] {
  return base.map((item) => ({ ...item, ...text.find((t) => t.slug === item.slug), slug: item.slug }))
}

export const getServices = cache(async (): Promise<Service[]> => mergeBySlug(codeServices, await getContent("services")))
export const getService = async (slug: string) => (await getServices()).find((s) => s.slug === slug)

export const getIndustries = cache(async (): Promise<Industry[]> => mergeBySlug(codeIndustries, await getContent("industries")))
export const getIndustry = async (slug: string) => (await getIndustries()).find((i) => i.slug === slug)

export const getFaqs = cache(async (): Promise<FilledFaqs> => {
  const [faqs, site, { settings }] = await Promise.all([getContent("faq"), getSite(), getPricing()])
  return fillFaqs(faqs, site, settings)
})

// Guides with the published switch from the admin applied.
export const getPosts = cache(async () => {
  const saved = await getContent("guides")
  return posts.map((post) => ({ ...post, published: saved.find((g) => g.slug === post.slug)?.published ?? post.published }))
})
export const getPublishedPosts = async () =>
  (await getPosts()).filter((p) => p.published).sort((a, b) => b.dateUpdated.localeCompare(a.dateUpdated))
export const getPost = async (slug: string) => (await getPosts()).find((p) => p.slug === slug)

// Page metadata with the title and description from the admin's SEO settings.
export async function seoMetadata(path: SeoContent["pages"][number]["path"], options: { noIndex?: boolean } = {}) {
  const { pages } = await getContent("seo")
  const page = pages.find((p) => p.path === path) ?? defaultSeo.pages.find((p) => p.path === path)
  if (!page) throw new Error(`No SEO entry for ${path}`)
  return pageMetadata({ title: page.title, description: page.description, path, ...options })
}

// What the admin editor starts from. Lists tied to code (services, industries,
// guides, SEO pages) always show every current item, even ones added to the
// code after the last save.
export async function getEditableContent(key: ContentKey): Promise<unknown> {
  const fill = <T,>(defaults: T[], saved: T[], id: (item: T) => string) =>
    defaults.map((item) => saved.find((s) => id(s) === id(item)) ?? item)
  switch (key) {
    case "services":
      return fill(defaultServicesText, await getContent("services"), (s) => s.slug)
    case "industries":
      return fill(defaultIndustriesText, await getContent("industries"), (i) => i.slug)
    case "guides":
      return fill(defaultGuides, await getContent("guides"), (g) => g.slug)
    case "seo":
      return { pages: fill(defaultSeo.pages, (await getContent("seo")).pages, (p) => p.path) }
    default:
      return getContent(key)
  }
}
