import { z } from "zod"
import { phoneField } from "@/lib/contact-schema"

export const businessTypes = [
  "Restaurant / cafe",
  "Salon / beauty",
  "Clinic",
  "Clothing / retail shop",
  "Home services",
  "Other",
] as const

export const mockupFeatures = [
  "See menu / products",
  "Order online",
  "Book appointments",
  "WhatsApp us",
  "See prices",
  "Find location",
] as const

export const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"]
// Vercel functions accept request bodies up to about 4.5 MB.
export const LOGO_MAX_BYTES = 4 * 1024 * 1024

const optionalUrl = z.union([z.literal(""), z.string().trim().url("Please enter a full link, starting with https://")])

// Shared by the /free-mockup form and the /api/free-mockup route.
export const mockupSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter your name").max(100),
    email: z.string().trim().email("Please enter a valid email address"),
    whatsapp: phoneField,
    business: z.string().trim().min(1, "Please enter your business name").max(120),
    businessType: z.enum(businessTypes, { message: "Please choose your business type" }),
    businessTypeOther: z.string().trim().max(80),
    location: z.string().trim().min(2, "Please enter your city and country").max(120),
    currentLink: optionalUrl,
    sells: z.string().trim().min(3, "Please tell us what you sell or offer").max(300),
    features: z.array(z.enum(mockupFeatures)).max(mockupFeatures.length),
    brandColours: z.string().trim().max(120),
    likedSites: z.array(optionalUrl).max(2),
    notes: z.string().trim().max(2000),
    ref: z.string().trim().max(60),
    company_website: z.string().max(0).optional(),
    turnstileToken: z.string().max(2048).optional(),
  })
  .refine((d) => d.businessType !== "Other" || d.businessTypeOther.length > 0, {
    message: "Please tell us your type of business",
    path: ["businessTypeOther"],
  })

export type MockupInput = z.infer<typeof mockupSchema>
