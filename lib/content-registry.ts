import type { z } from "zod"
import {
  aiSettingsSchema,
  faqContentSchema,
  guidesSchema,
  homeSchema,
  industriesTextSchema,
  seoSchema,
  servicesTextSchema,
  siteSchema,
  teamSchema,
  testimonialsSchema,
} from "@/lib/cms/schemas"
import {
  defaultAi,
  defaultFaqs,
  defaultGuides,
  defaultHome,
  defaultIndustriesText,
  defaultSeo,
  defaultServicesText,
  defaultSite,
  defaultTeam,
  defaultTestimonials,
} from "@/lib/cms/defaults"

// Website content editable at /admin/website/[key]. Saving publishes straight
// away; every save keeps the previous version for restoring.
export type ContentEntry<T = unknown> = {
  label: string
  schema: z.ZodType<T>
  defaults: T
}

const entry = <T,>(e: ContentEntry<T>) => e as ContentEntry

export const contentRegistry = {
  site: entry({ label: "site settings", schema: siteSchema, defaults: defaultSite }),
  home: entry({ label: "the homepage", schema: homeSchema, defaults: defaultHome }),
  services: entry({ label: "services", schema: servicesTextSchema, defaults: defaultServicesText }),
  industries: entry({ label: "industry pages", schema: industriesTextSchema, defaults: defaultIndustriesText }),
  team: entry({ label: "the team", schema: teamSchema, defaults: defaultTeam }),
  testimonials: entry({ label: "testimonials", schema: testimonialsSchema, defaults: defaultTestimonials }),
  faq: entry({ label: "the FAQs", schema: faqContentSchema, defaults: defaultFaqs }),
  seo: entry({ label: "page titles & descriptions", schema: seoSchema, defaults: defaultSeo }),
  ai: entry({ label: "the AI assistant", schema: aiSettingsSchema, defaults: defaultAi }),
  guides: entry({ label: "guides", schema: guidesSchema, defaults: defaultGuides }),
} satisfies Record<string, ContentEntry>

export type ContentKey = keyof typeof contentRegistry

export const isContentKey = (key: string): key is ContentKey => Object.hasOwn(contentRegistry, key)
