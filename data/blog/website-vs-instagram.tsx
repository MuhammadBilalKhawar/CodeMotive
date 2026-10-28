import Link from "next/link"
import { priceOf, deliveryOf } from "@/components/blog/price-bits"
import type { BlogPost } from "@/data/blog/types"

export const websiteVsInstagram: BlogPost = {
  slug: "website-vs-instagram",
  title: "Do I Need a Website If I Have Instagram?",
  description:
    "Instagram is great for being discovered. What a website adds for a small business, from Google search to bookings, and when Instagram alone is enough.",
  published: false,
  datePublished: "2026-10-25",
  dateUpdated: "2026-10-25",
  readingMinutes: 4,
  serviceSlugs: ["websites", "shopify"],
  Content: ({ pricing }) => (
    <>
      <p className="lead">
        Yes, if you want customers to find you on Google, see your prices and book or order without waiting for a reply.
        Instagram is great for being discovered and showing your work; a website turns that attention into enquiries and sales
        you control. Most small businesses do best with both, linked to each other.
      </p>

      <h2>What Instagram does well</h2>
      <ul>
        <li>People discover you through reels, hashtags and shares.</li>
        <li>It shows your work, products and personality day to day.</li>
        <li>Customers can message you directly.</li>
      </ul>
      <p>For a new business, that&apos;s a great start. The limits show up as you grow.</p>

      <h2>What a website adds</h2>
      <h3>You show up on Google</h3>
      <p>
        When someone searches &quot;salon near me&quot; or &quot;clothing brand Lahore&quot;, Google shows websites and Google
        Business Profiles. An Instagram profile alone rarely appears for those searches.
      </p>
      <h3>Answers without waiting</h3>
      <p>
        Prices, menus, opening hours, delivery areas and your location in one place, available at 2 a.m. without anyone typing a
        reply.
      </p>
      <h3>Bookings and orders</h3>
      <p>
        Customers can book an appointment, request a quote or order products themselves, with cash on delivery or online payment,
        instead of a long back-and-forth in DMs.
      </p>
      <h3>You own it</h3>
      <p>
        An algorithm change or a locked account can cut you off from your customers overnight. Your website and domain stay yours.
      </p>
      <h3>It looks established</h3>
      <p>For many customers, especially larger clients and people abroad, a proper website is a sign the business is real.</p>

      <h2>When Instagram alone is enough</h2>
      <p>
        If you&apos;re still testing an idea, sell a handful of items to people who already know you, or have no time to handle
        enquiries from search, Instagram on its own is fine for now. Add a website when you want more customers than your
        followers can bring.
      </p>

      <h2>How they work together</h2>
      <ul>
        <li>Put your website in your Instagram bio, pointing to bookings or your shop.</li>
        <li>Link back to your Instagram from the website so visitors can see your latest work.</li>
        <li>Use one WhatsApp number on both, so every enquiry lands in one place.</li>
      </ul>

      <h2>What it costs</h2>
      <p>
        A simple business website with us starts from {priceOf(pricing, "starter")} ({priceOf(pricing, "starter", "USD")}{" "}
        internationally) and usually goes live in {deliveryOf(pricing, "starter")}. If you sell products, an online store starts
        from {priceOf(pricing, "shopify")}. See <Link href="/services/websites">business websites</Link>,{" "}
        <Link href="/services/shopify">online stores</Link>, or <Link href="/contact">ask for a quote</Link>.
      </p>
    </>
  ),
}
