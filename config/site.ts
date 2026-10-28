// Single source for business details, contact info and profile links.
// Values can be overridden with environment variables (see section 7 of the
// implementation plan). An empty env value hides that link everywhere.

const fromEnv = (value: string | undefined, fallback: string) => value ?? fallback

const whatsappNumber = fromEnv(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "923265152747")

export type SocialProfile = {
  name: "LinkedIn" | "Instagram" | "Upwork"
  url: string
}

const socialProfiles: SocialProfile[] = [
  { name: "LinkedIn", url: fromEnv(process.env.LINKEDIN_URL, "https://www.linkedin.com/company/code-motive") },
  { name: "Instagram", url: fromEnv(process.env.INSTAGRAM_URL, "https://www.instagram.com/codemotive.dev/") },
  // No Upwork profile yet: set UPWORK_URL to show it.
  { name: "Upwork", url: fromEnv(process.env.UPWORK_URL, "") },
]

export const siteConfig = {
  name: "CodeMotive",
  tagline: "Software & Digital Solutions",
  url: fromEnv(process.env.NEXT_PUBLIC_SITE_URL, "https://code-motive.dev"),
  // The one sentence used to describe the company everywhere (about page,
  // metadata, JSON-LD). Keep it identical across the site and profiles.
  summary:
    "CodeMotive is a Lahore-based web development firm that builds business websites, Shopify stores, integrations and AI automation for businesses in Pakistan and worldwide.",
  themeColor: "#0F2D23",
  email: "admin@code-motive.dev",
  address: {
    street: fromEnv(process.env.BUSINESS_ADDRESS, ""),
    locality: "Lahore",
    country: "Pakistan",
    countryCode: "PK",
  },
  whatsapp: {
    number: whatsappNumber,
    display: `+${whatsappNumber.slice(0, 2)} ${whatsappNumber.slice(2, 5)} ${whatsappNumber.slice(5)}`,
    url: `https://wa.me/${whatsappNumber}`,
  },
  replyPromise: "We reply within 24 hours.",
  social: socialProfiles.filter((profile) => profile.url !== ""),
}

export const fullAddress = [siteConfig.address.street, siteConfig.address.locality, siteConfig.address.country]
  .filter(Boolean)
  .join(", ")

export const mainNav = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/work", label: "Our Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]
