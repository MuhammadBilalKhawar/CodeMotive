import type { Metadata } from "next"
import { siteConfig } from "@/config/site"
import { founders } from "@/data/founders"
import type { FaqItem } from "@/data/faq"
import type { PricingPackage } from "@/lib/content-schema"

// Shared metadata and JSON-LD builders, so every page's title, Open Graph
// tags and structured data follow the same rules and use the same data.

export const organizationId = `${siteConfig.url}/#organization`
export const absoluteUrl = (path: string) => `${siteConfig.url}${path === "/" ? "" : path}`

type PageMetaInput = {
  // Without " | CodeMotive" (the layout template adds it). Keep it ≤ 47 characters.
  title: string
  // ≤ 155 characters.
  description: string
  path: string
  // For pages that shouldn't be indexed (drafts, the mockup page).
  noIndex?: boolean
  type?: "website" | "article"
}

// Per-page title, description, canonical, Open Graph and Twitter tags. Without
// this every page would inherit the homepage's Open Graph title.
// The brand share image (app/opengraph-image.png). Pages that set their own
// Open Graph tags don't inherit it, so it's added explicitly.
const shareImage = { url: "/opengraph-image.png", width: 1200, height: 630, alt: `${siteConfig.name}: ${siteConfig.tagline}` }

export function pageMetadata({ title, description, path, noIndex, type = "website" }: PageMetaInput): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      type,
      siteName: siteConfig.name,
      locale: "en_PK",
      images: [shareImage],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [shareImage.url] },
    ...(noIndex && { robots: { index: false, follow: true } }),
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    publisher: { "@id": organizationId },
  }
}

export type Crumb = { name: string; path: string }

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
}

// One offer per published "starting from" price, per currency.
function offers(packages: PricingPackage[]) {
  return packages.flatMap((pkg) =>
    (["PKR", "USD"] as const)
      .filter((currency) => pkg.priceFrom[currency] !== null)
      .map((currency) => ({
        "@type": "Offer",
        name: pkg.name,
        url: absoluteUrl(`/contact?package=${pkg.id}`),
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: pkg.priceFrom[currency],
          priceCurrency: currency,
          ...(pkg.unit === "monthly" && { unitText: "MONTH" }),
        },
      })),
  )
}

export function serviceJsonLd({ name, description, path, packages }: { name: string; description: string; path: string; packages: PricingPackage[] }) {
  const list = offers(packages)
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType: name,
    description,
    url: absoluteUrl(path),
    provider: { "@id": organizationId },
    areaServed: ["Pakistan", "Worldwide"],
    ...(list.length && { offers: list }),
  }
}

const author = founders.find((f) => f.name === "Muhammad Bilal") ?? founders[0]

export const blogAuthor = {
  name: author.name,
  initials: author.initials,
  role: author.role,
  bio: author.bio,
}

export function articleJsonLd({ title, description, path, published, updated }: { title: string; description: string; path: string; published: string; updated: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: published,
    dateModified: updated,
    mainEntityOfPage: absoluteUrl(path),
    image: absoluteUrl("/opengraph-image.png"),
    author: { "@type": "Person", name: author.name, jobTitle: author.role, url: absoluteUrl("/about") },
    publisher: { "@id": organizationId },
  }
}
