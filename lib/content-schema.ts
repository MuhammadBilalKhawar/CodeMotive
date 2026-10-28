import { z } from "zod"

// Shapes for the content that the admin can edit (prices and projects).
// The same schemas validate admin saves and data read back from MongoDB.

const price = z.number().int().nonnegative().nullable()
const line = z.string().trim().min(1).max(200)

export const packageSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  audience: z.string().trim().min(1).max(160),
  // null renders as "Custom quote".
  priceFrom: z.object({ PKR: price, USD: price }),
  unit: z.enum(["one-time", "monthly"]),
  popular: z.boolean().optional(),
  features: z.array(line).max(12),
  // Typical delivery in days, [min, max]. null where it depends on scope.
  deliveryDays: z.tuple([z.number().int().positive(), z.number().int().positive()]).nullable(),
  revisions: z.number().int().nonnegative().nullable(),
  notIncluded: z.array(line).max(12),
})

export const pricingSettingsSchema = z.object({
  paymentTerms: z.object({
    split: z.string().trim().min(1).max(120),
    methods: z.object({ PKR: z.string().trim().min(1).max(120), USD: z.string().trim().min(1).max(120) }),
  }),
  hostingNote: z.string().trim().min(1).max(500),
  priceFactors: z.array(line).max(12),
  notIncludedAnywhere: z.array(line).max(12),
})

export const pricingContentSchema = z.object({
  packages: z.array(packageSchema),
  settings: pricingSettingsSchema,
})

export const projectTags = ["Websites", "Ecommerce", "Integrations", "AI"] as const

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  title: z.string().trim().min(1).max(80),
  type: z.enum(["Client project", "Demo concept"]),
  status: z.enum(["live", "in-development"]),
  industry: z.string().trim().min(1).max(60),
  country: z.string().trim().min(1).max(60),
  services: z.array(z.enum(projectTags)).min(1),
  summary: z.string().trim().min(1).max(400),
  // Real, verifiable results only.
  result: z.string().trim().max(200).optional(),
  stack: z.array(z.string().trim().min(1).max(40)).max(15),
  image: z
    .object({
      src: z.string().min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      alt: z.string().trim().min(1).max(160),
    })
    .optional(),
  liveUrl: z.union([z.literal(""), z.string().url()]),
  // May this project be shown publicly (and used by the AI reply)?
  shareable: z.boolean(),
})

export const projectsContentSchema = z
  .array(projectSchema)
  .refine((list) => new Set(list.map((p) => p.slug)).size === list.length, "Each project needs a unique slug")

export type Currency = "PKR" | "USD"
export type PricingPackage = z.infer<typeof packageSchema>
export type PricingSettings = z.infer<typeof pricingSettingsSchema>
export type PricingContent = z.infer<typeof pricingContentSchema>
export type ProjectTag = (typeof projectTags)[number]
export type Project = z.infer<typeof projectSchema>
