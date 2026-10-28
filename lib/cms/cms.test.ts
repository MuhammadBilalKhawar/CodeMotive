import { describe, expect, it } from "vitest"
import { contentRegistry } from "@/lib/content-registry"
import { editorSpecs, fieldPathLabel, type Field } from "@/lib/cms/fields"
import { fillTokens, siteInfo } from "@/lib/cms/site-info"
import { fillFaqs } from "@/lib/cms/faqs"
import { defaultFaqs, defaultSite } from "@/lib/cms/defaults"
import { defaultPricing } from "@/data/pricing"
import { posts } from "@/data/blog"
import { services } from "@/data/services"

describe("CMS defaults", () => {
  it.each(Object.entries(contentRegistry))("%s defaults pass their own schema", (_key, entry) => {
    const result = entry.schema.safeParse(entry.defaults)
    expect(result.success, result.success ? "" : result.error.message).toBe(true)
  })

  it("keeps every service and guide from the code", () => {
    expect((contentRegistry.services.defaults as { slug: string }[]).map((s) => s.slug)).toEqual(services.map((s) => s.slug))
    expect((contentRegistry.guides.defaults as { slug: string }[]).map((g) => g.slug)).toEqual(posts.map((p) => p.slug))
  })
})

describe("editor field lists", () => {
  // Every key in a field list must exist in the content, or the editor would show empty boxes.
  const check = (field: Field, value: unknown, path: string) => {
    if (field.type === "group") {
      expect(value, path).toBeTypeOf("object")
      for (const child of field.fields) check(child, (value as Record<string, unknown>)[child.key], `${path}.${child.key}`)
    } else if (field.type === "list") {
      expect(Array.isArray(value), path).toBe(true)
      for (const item of value as Record<string, unknown>[]) {
        for (const child of field.fields) {
          expect(Object.hasOwn(item, child.key), `${path}[].${child.key}`).toBe(true)
          check(child, item[child.key], `${path}[].${child.key}`)
        }
      }
    }
  }

  it.each(Object.entries(editorSpecs))("%s fields match the content", (key, spec) => {
    check(spec.field, contentRegistry[key as keyof typeof contentRegistry].defaults, key)
  })
})

describe("site info", () => {
  it("derives the WhatsApp link, address and visible profiles", () => {
    const info = siteInfo({ ...defaultSite, whatsappNumber: "923001234567", social: { linkedin: "https://x.test/l", instagram: "", facebook: "", upwork: "" } })
    expect(info.whatsappUrl).toBe("https://wa.me/923001234567")
    expect(info.whatsappDisplay).toBe("+92 300 1234567")
    expect(info.fullAddress).toBe("Lahore, Pakistan")
    expect(info.socialProfiles).toEqual([{ name: "LinkedIn", url: "https://x.test/l" }])
  })

  it("fills known tokens and leaves unknown ones", () => {
    expect(fillTokens("Pay {split}, see {other}", { split: "50/50" })).toBe("Pay 50/50, see {other}")
  })

  it("fills FAQ answers from the site and pricing settings", () => {
    const faqs = fillFaqs(defaultFaqs, { ...defaultSite, deliveryPromise: "Live in 5 days." }, defaultPricing.settings)
    const all = [...faqs.general, ...faqs.pricing].map((f) => f.answer).join(" ")
    expect(all).toContain("Live in 5 days.")
    expect(all).toContain(defaultPricing.settings.paymentTerms.split)
    expect(all).not.toMatch(/\{\w+\}/)
  })
})

describe("save error labels", () => {
  it("names fields the way the editor shows them", () => {
    const services = contentRegistry.services.defaults as { name: string }[]
    expect(fieldPathLabel(editorSpecs.services.field, services, [0, "metaTitle"])).toBe(`${services[0].name} › Google title`)
    expect(fieldPathLabel(editorSpecs.site.field, defaultSite, ["address", "countryCode"])).toBe("Address › Country code")
    expect(fieldPathLabel(editorSpecs.faq.field, defaultFaqs, ["general", 1, "answer"])).toBe(`Homepage FAQs › ${defaultFaqs.general[1].question} › Answer`)
  })

  it("explains limits in plain words", () => {
    const result = contentRegistry.site.schema.safeParse({ ...defaultSite, tagline: "x".repeat(81), mockupDays: Number.NaN })
    expect(result.success).toBe(false)
    const messages = result.success ? [] : result.error.issues.map((i) => i.message)
    expect(messages).toContain("Keep it to 80 characters or fewer")
    expect(messages).toContain("Enter a number")
  })
})
