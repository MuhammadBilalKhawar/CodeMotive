import type { PricingContent } from "@/lib/content-schema"

export type BlogPost = {
  slug: string
  // Keep ≤ 47 characters (the layout adds " | CodeMotive").
  title: string
  // ≤ 155 characters; also the summary on the blog index.
  description: string
  // Drafts are reachable by URL for review but are noindex and left out of
  // the blog index, sitemap and llms.txt. Set to true once reviewed.
  published: boolean
  datePublished: string
  dateUpdated: string
  readingMinutes: number
  // Service pages this guide links to.
  serviceSlugs: string[]
  // Article body. Receives live pricing so numbers always match /pricing.
  Content: (props: { pricing: PricingContent }) => React.ReactNode
}
