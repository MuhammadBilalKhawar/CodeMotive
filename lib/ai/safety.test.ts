import { describe, expect, it } from "vitest"
import { cleanReply, extractMoney, isReplySafe } from "@/lib/ai/safety"
import { allowedPrices, buildCompanyFacts } from "@/lib/ai/knowledge"
import { defaultPricing } from "@/data/pricing"
import { defaultProjects } from "@/data/projects"

const facts = buildCompanyFacts({ pricing: defaultPricing, projects: defaultProjects })
const allowed = allowedPrices(defaultPricing)
const shopify = defaultPricing.packages.find((p) => p.id === "shopify")!

describe("extractMoney", () => {
  it("finds PKR and USD amounts in common formats", () => {
    expect(extractMoney("starting from PKR 90,000 or $899")).toEqual([
      { currency: "PKR", amount: 90000 },
      { currency: "USD", amount: 899 },
    ])
    expect(extractMoney("Rs. 35k for the starter")).toEqual([{ currency: "PKR", amount: 35000 }])
    expect(extractMoney("about 75,000 rupees")).toEqual([{ currency: "PKR", amount: 75000 }])
    expect(extractMoney("from 699 USD")).toEqual([{ currency: "USD", amount: 699 }])
  })

  it("ignores numbers that aren't money", () => {
    expect(extractMoney("Most websites go live in 1 to 3 weeks, up to 30 products, reply within 24 hours.")).toEqual([])
  })
})

describe("isReplySafe (price safety check)", () => {
  it("accepts the published Shopify starting price in either currency", () => {
    expect(isReplySafe(`A Shopify store starts from PKR ${shopify.priceFrom.PKR!.toLocaleString("en-US")}.`, allowed, facts)).toBe(true)
    expect(isReplySafe(`A Shopify store starts from $${shopify.priceFrom.USD}.`, allowed, facts)).toBe(true)
  })

  it("rejects a price that isn't on the pricing page", () => {
    expect(isReplySafe("We can do your store for PKR 20,000.", allowed, facts)).toBe(false)
    expect(isReplySafe("Only $150 for a full website!", allowed, facts)).toBe(false)
  })

  it("rejects invented discounts but allows the published payment split", () => {
    expect(isReplySafe("Good news: we can give you 90% off.", allowed, facts)).toBe(false)
    expect(isReplySafe("Payment is 50% upfront, 50% before launch.", allowed, facts)).toBe(true)
  })
})

describe("cleanReply", () => {
  it("strips markdown and caps the length", () => {
    expect(cleanReply("**Hi Ali!**\n- Shopify store\n# Next steps")).toBe("Hi Ali!\nShopify store\nNext steps")
    expect(cleanReply("x".repeat(3000)).length).toBe(1400)
  })
})
