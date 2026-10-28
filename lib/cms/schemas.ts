import { z } from "zod"

// Shapes of the website content editable in the admin CMS. Used by the
// editors (client-side checks), the save actions and the getters.

// Messages are shown to the admin as they are, so keep them plain.
const tooLong = (max: number) => `Keep it to ${max} characters or fewer`
const text = (max: number, min = 1) => z.string().trim().min(min, "This can't be empty").max(max, tooLong(max))
const optionalText = (max: number) => z.string().trim().max(max, tooLong(max))
const url = z.union([z.literal(""), z.string().trim().url()], { errorMap: () => ({ message: "Use a full link starting with https://, or leave it empty" }) })
const lines = (max: number, itemMax = 200) => z.array(text(itemMax)).max(max, `Up to ${max} lines`)
const faq = z.object({ question: text(200), answer: text(1200) })

export const siteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  // Digits with country code, no "+": 923001234567
  whatsappNumber: z.string().trim().regex(/^\d{10,15}$/, "Digits only, with country code, e.g. 923001234567"),
  address: z.object({
    street: optionalText(160),
    locality: text(80),
    country: text(80),
    countryCode: z.string().trim().regex(/^[A-Z]{2}$/, "Two capital letters, e.g. PK"),
  }),
  social: z.object({ linkedin: url, instagram: url, upwork: url, facebook: url }),
  tagline: text(80),
  // The one sentence that describes the company everywhere.
  summary: text(300),
  replyPromise: text(120),
  deliveryPromise: text(160),
  // Working days to deliver a free homepage mockup.
  mockupDays: z.number({ invalid_type_error: "Enter a number" }).int("Whole days only").min(1, "At least 1 day").max(30, "30 days at most"),
})

export const homeSchema = z.object({
  hero: z.object({
    title: text(120),
    titleAccent: text(80),
    subline: text(300),
    chips: lines(4, 80),
    trust: lines(3, 80),
  }),
  audiences: z.array(z.object({ title: text(60), text: text(160), href: text(120) })).length(4),
  steps: z.array(z.object({ title: text(60), text: text(200) })).length(4),
})

export const serviceTextSchema = z.object({
  slug: text(40),
  name: text(60),
  short: text(200),
  intro: text(400),
  problem: text(400),
  included: lines(10),
  timeline: text(200),
  faqs: z.array(faq).max(6),
  metaTitle: text(47),
  metaDescription: text(155),
})
export const servicesTextSchema = z.array(serviceTextSchema)

export const industryTextSchema = z.object({
  slug: text(40),
  name: text(80),
  short: text(40),
  intro: text(500),
  problem: text(400),
  needs: z.array(z.object({ title: text(80), text: text(300) })).min(1).max(8),
  faqs: z.array(faq).max(6),
  metaTitle: text(47),
  metaDescription: text(155),
})
export const industriesTextSchema = z.array(industryTextSchema)

export const teamSchema = z
  .array(
    z.object({
      name: text(80),
      initials: text(3),
      role: text(80),
      experience: text(80),
      skills: lines(10, 40),
      bio: text(400),
      handles: lines(6, 120),
      linkedinUrl: url,
      // Uploaded photo (/api/images/...). Empty shows the initials.
      photo: optionalText(200),
    }),
  )
  .min(1)
  .max(12)

export const testimonialsSchema = z
  .array(
    z.object({
      name: text(80),
      business: text(80),
      country: text(60),
      quote: text(600),
      // Where the review can be verified (Upwork, Google, Clutch...). Required: real reviews only.
      sourceUrl: z.string().trim().url("Add the full link to the original review"),
    }),
  )
  .max(30)

export const faqContentSchema = z.object({ general: z.array(faq).max(12), pricing: z.array(faq).max(12) })

export const seoPaths = ["/", "/services", "/pricing", "/industries", "/work", "/about", "/contact", "/blog"] as const
export const seoSchema = z.object({
  pages: z.array(z.object({ path: z.enum(seoPaths), title: text(47), description: text(155) })),
})

export const aiSettingsSchema = z.object({
  chatEnabled: z.boolean(),
  greeting: text(300),
  suggestions: lines(4, 60),
  // Extra facts the AI may use (one per line), e.g. "We're closed on Sundays."
  extraFacts: lines(20, 300),
  // Services we don't offer right now (one per line).
  notOffered: lines(10, 160),
})

// Guides are written in code (data/blog); the admin only publishes or hides them.
export const guidesSchema = z.array(z.object({ slug: text(80), published: z.boolean() }))

export type SiteContent = z.infer<typeof siteSchema>
export type HomeContent = z.infer<typeof homeSchema>
export type ServiceText = z.infer<typeof serviceTextSchema>
export type IndustryText = z.infer<typeof industryTextSchema>
export type TeamContent = z.infer<typeof teamSchema>
export type TestimonialsContent = z.infer<typeof testimonialsSchema>
export type FaqContent = z.infer<typeof faqContentSchema>
export type SeoContent = z.infer<typeof seoSchema>
export type AiSettings = z.infer<typeof aiSettingsSchema>
export type GuidesContent = z.infer<typeof guidesSchema>
