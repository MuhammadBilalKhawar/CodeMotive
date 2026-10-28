import Link from "next/link"
import { buildPackageIds, carePlanIds, findPackage, formatPrice } from "@/data/pricing"
import { PriceTable, priceOf } from "@/components/blog/price-bits"
import type { BlogPost } from "@/data/blog/types"

export const websiteCostPakistan: BlogPost = {
  slug: "website-cost-pakistan",
  title: "How Much Does a Website Cost in Pakistan?",
  description:
    "What a business website or online store costs in Pakistan, what's included at each price, the extra costs to plan for, and how to keep the cost down.",
  published: false,
  datePublished: "2026-10-25",
  dateUpdated: "2026-10-25",
  readingMinutes: 5,
  serviceSlugs: ["websites", "shopify", "care-plans"],
  Content: ({ pricing }) => {
    const { settings } = pricing
    const care = carePlanIds.map((id) => findPackage(pricing.packages, id)).filter((p) => p !== undefined)
    return (
      <>
        <p className="lead">
          At CodeMotive, a business website in Pakistan starts from {priceOf(pricing, "starter")} for a simple site of up to 5
          pages, and from {priceOf(pricing, "business")} for a larger site with a blog and bookings. An online store on Shopify
          starts from {priceOf(pricing, "shopify")}. Your exact price is fixed in a written quote before any work starts.
        </p>
        <p>
          &quot;How much does a website cost?&quot; gets answers anywhere from a few thousand rupees to several lakh, because
          &quot;a website&quot; can mean very different things. Below is what you actually get at each of our price points, what
          pushes the price up, and the running costs people often forget.
        </p>

        <h2>What you get at each price</h2>
        <p>These are starting prices. International clients are quoted in US dollars.</p>
        <PriceTable pricing={pricing} ids={buildPackageIds} />
        <p>
          The full list of what each package includes is on the <Link href="/pricing">pricing page</Link>. If you sell products,
          start with <Link href="/services/shopify">Shopify &amp; ecommerce stores</Link>; for everything else,{" "}
          <Link href="/services/websites">business websites</Link>.
        </p>

        <h2>What makes a website cost more</h2>
        <p>The starting price covers the package as listed. These are the things that change the final quote:</p>
        <ul>
          {settings.priceFactors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>
        <p>
          Content writing and rush delivery are the two that surprise people most. If you already have your text and photos,
          the project is cheaper and faster.
        </p>

        <h2>Costs that aren&apos;t part of the build</h2>
        <p>Some costs are paid directly to other companies, not to us, so plan for them separately:</p>
        <ul>
          {settings.notIncludedAnywhere.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>A domain name is renewed every year. For a Shopify store, the Shopify plan is a monthly fee paid to Shopify.</p>

        <h2>Monthly costs after launch</h2>
        <p>
          You don&apos;t have to pay us monthly. If you want us to look after the site, our care plans start from{" "}
          {care[0] ? `${priceOf(pricing, care[0].id)} a month` : "a fixed monthly fee"}:
        </p>
        <ul>
          {care.map((plan) => (
            <li key={plan.id}>
              <strong>{plan.name}</strong>
              {plan.priceFrom.PKR !== null && ` (from ${formatPrice(plan.priceFrom.PKR, "PKR")}/month)`}: {plan.features.join(", ")}.
            </li>
          ))}
        </ul>
        <p>{settings.hostingNote}</p>

        <h2>How to keep the cost down</h2>
        <ul>
          <li>Start with the pages you need now. A Starter site can grow into a bigger one later.</li>
          <li>Have your logo, text and photos ready before the build starts.</li>
          <li>For a store, start with a ready-made Shopify theme and customise it, rather than a fully custom design.</li>
          <li>Add custom features once you know you need them, not &quot;just in case&quot;.</li>
          <li>Give feedback in one round per stage, from one person.</li>
        </ul>

        <h2>How payment works</h2>
        <p>
          Payment is {settings.paymentTerms.split}. In Pakistan we accept {settings.paymentTerms.methods.PKR.toLowerCase()};
          international clients can pay by {settings.paymentTerms.methods.USD}. There&apos;s no hourly billing: the quote is
          fixed unless you change the scope.
        </p>
        <p>
          Want a number for your own project? <Link href="/contact">Tell us what you need</Link> and we&apos;ll send a fixed quote,
          usually within 24 hours.
        </p>
      </>
    )
  },
}
