import { describe, expect, it } from "vitest"
import { contactSchema } from "@/lib/contact-schema"
import { mockupSchema } from "@/lib/mockup-schema"
import { pricingContentSchema, projectsContentSchema } from "@/lib/content-schema"
import { defaultPricing } from "@/data/pricing"
import { defaultProjects } from "@/data/projects"

const contact = {
  name: "Ali Khan",
  email: "ali@example.com",
  phone: "+92 300 1234567",
  business: "",
  country: "PK",
  service: "Business website",
  budget: "",
  message: "I need a website for my restaurant in Lahore.",
}

const mockup = {
  name: "Hina Malik",
  email: "hina@example.com",
  whatsapp: "",
  business: "Hina's Kitchen",
  businessType: "Restaurant / cafe",
  businessTypeOther: "",
  location: "Lahore, Pakistan",
  currentLink: "",
  sells: "Home-style food and catering",
  features: ["See menu / products", "WhatsApp us"],
  brandColours: "",
  likedSites: [],
  notes: "",
  ref: "email-batch-3",
}

const fieldErrors = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => String(i.path[0]))

describe("contact form schema", () => {
  it("accepts a valid enquiry", () => {
    expect(contactSchema.safeParse(contact).success).toBe(true)
  })

  it("rejects a bad email, a too-short message and an unknown service", () => {
    const result = contactSchema.safeParse({ ...contact, email: "nope", message: "Hi", service: "Mobile app" })
    expect(fieldErrors(result).sort()).toEqual(["email", "message", "service"])
  })

  it("caps the message at 2,000 characters", () => {
    expect(contactSchema.safeParse({ ...contact, message: "x".repeat(2001) }).success).toBe(false)
  })

  it("allows an empty phone but rejects one without enough digits", () => {
    expect(contactSchema.safeParse({ ...contact, phone: "" }).success).toBe(true)
    expect(fieldErrors(contactSchema.safeParse({ ...contact, phone: "12" }))).toEqual(["phone"])
  })

  it("rejects a filled-in honeypot", () => {
    expect(contactSchema.safeParse({ ...contact, company_website: "spam.com" }).success).toBe(false)
  })
})

describe("free mockup schema", () => {
  it("accepts a valid request", () => {
    expect(mockupSchema.safeParse(mockup).success).toBe(true)
  })

  it("needs a business type description when 'Other' is chosen", () => {
    expect(fieldErrors(mockupSchema.safeParse({ ...mockup, businessType: "Other" }))).toEqual(["businessTypeOther"])
    expect(mockupSchema.safeParse({ ...mockup, businessType: "Other", businessTypeOther: "Bakery" }).success).toBe(true)
  })

  it("only accepts full links, and at most two liked websites", () => {
    expect(fieldErrors(mockupSchema.safeParse({ ...mockup, currentLink: "instagram.com/x" }))).toEqual(["currentLink"])
    expect(mockupSchema.safeParse({ ...mockup, likedSites: ["https://a.com", "https://b.com", "https://c.com"] }).success).toBe(false)
  })
})

describe("admin content schemas", () => {
  it("accept the default prices and projects", () => {
    expect(pricingContentSchema.safeParse(defaultPricing).success).toBe(true)
    expect(projectsContentSchema.safeParse(defaultProjects).success).toBe(true)
  })

  it("reject negative or fractional prices", () => {
    const bad = structuredClone(defaultPricing)
    bad.packages[0].priceFrom.PKR = -5
    expect(pricingContentSchema.safeParse(bad).success).toBe(false)
    bad.packages[0].priceFrom.PKR = 35000.5
    expect(pricingContentSchema.safeParse(bad).success).toBe(false)
  })

  it("reject duplicate or malformed project slugs", () => {
    expect(projectsContentSchema.safeParse([defaultProjects[0], defaultProjects[0]]).success).toBe(false)
    expect(projectsContentSchema.safeParse([{ ...defaultProjects[0], slug: "Not A Slug" }]).success).toBe(false)
  })
})
