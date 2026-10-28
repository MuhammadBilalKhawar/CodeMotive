import Link from "next/link"
import { deliveryOf } from "@/components/blog/price-bits"
import { deliveryPromise } from "@/data/faq"
import type { BlogPost } from "@/data/blog/types"

export const websiteBuildTime: BlogPost = {
  slug: "how-long-to-build-a-website",
  title: "How Long Does It Take to Build a Website?",
  description:
    "Typical timelines for a business website and a Shopify store, the steps in between, and what speeds a project up or slows it down.",
  published: false,
  datePublished: "2026-10-25",
  dateUpdated: "2026-10-25",
  readingMinutes: 4,
  serviceSlugs: ["websites", "shopify"],
  Content: ({ pricing }) => (
    <>
      <p className="lead">
        {deliveryPromise} With us, a simple Starter website usually takes {deliveryOf(pricing, "starter")}, a larger Business
        website {deliveryOf(pricing, "business")}, and a Shopify store {deliveryOf(pricing, "shopify")}, depending mostly on the
        number of pages or products and how quickly content and feedback arrive.
      </p>

      <h2>The steps, from first call to launch</h2>
      <ol>
        <li>
          <strong>Free call.</strong> You tell us about your business, what the site needs to do and any deadline.
        </li>
        <li>
          <strong>Fixed quote.</strong> A written quote with the scope, price and timeline. Work starts once it&apos;s agreed.
        </li>
        <li>
          <strong>Content.</strong> Your logo, text and photos, or we help with them if that&apos;s part of the quote.
        </li>
        <li>
          <strong>Design.</strong> The look of the main pages, adjusted with your feedback.
        </li>
        <li>
          <strong>Build.</strong> All pages, forms, WhatsApp, maps and any integrations, with a short update every week.
        </li>
        <li>
          <strong>Review.</strong> You check everything on your phone and computer; we fix what you find.
        </li>
        <li>
          <strong>Launch.</strong> We connect your domain, put the site live and show you how it works.
        </li>
      </ol>

      <h2>What slows a project down</h2>
      <ul>
        <li>Waiting for text, photos or product details. This is the most common delay by far.</li>
        <li>Feedback coming from several people, or arriving in many small rounds.</li>
        <li>New features added halfway through. These are worth doing, but they need their own time.</li>
        <li>Domain or hosting access that nobody can find.</li>
      </ul>

      <h2>How to get your site live sooner</h2>
      <ul>
        <li>Have your logo, text and photos ready before we start.</li>
        <li>Send two or three websites you like, so the design starts in the right direction.</li>
        <li>Pick one person to give feedback and approve each stage.</li>
        <li>For a store, prepare a spreadsheet of products with names, prices, sizes and photos.</li>
        <li>Keep &quot;nice to have&quot; features for a second phase after launch.</li>
      </ul>

      <h2>Can it be done faster?</h2>
      <p>
        Often, yes. If you have a deadline such as an opening or a sale, tell us on the first call. Rush delivery is possible for
        many projects and is included in the quote, so the price and the date are both agreed before we start.
      </p>

      <h2>After launch</h2>
      <p>
        Your site doesn&apos;t stop on launch day. Our <Link href="/services/care-plans">care plans</Link> cover hosting, updates
        and small monthly edits, or we can quote changes when you need them.
      </p>
      <p>
        Ready to plan yours? See <Link href="/services/websites">business websites</Link> and{" "}
        <Link href="/services/shopify">online stores</Link>, or <Link href="/contact">get a free quote</Link> with a timeline.
      </p>
    </>
  ),
}
