import type { SiteContent } from "@/lib/cms/schemas"

// Values derived from the editable site settings. No server imports, so client
// components can use it too.

export type SocialName = "LinkedIn" | "Instagram" | "Facebook" | "Upwork"
export type SocialProfile = { name: SocialName; url: string }

export type SiteInfo = SiteContent & {
  whatsappUrl: string
  // "+92 326 5152747"
  whatsappDisplay: string
  fullAddress: string
  socialProfiles: SocialProfile[]
}

// The parts client components need (chat panel, form errors).
export type SiteContact = Pick<SiteInfo, "email" | "whatsappUrl" | "whatsappDisplay" | "mockupDays">

export function siteInfo(site: SiteContent): SiteInfo {
  const n = site.whatsappNumber
  const social: SocialProfile[] = [
    { name: "LinkedIn", url: site.social.linkedin },
    { name: "Instagram", url: site.social.instagram },
    { name: "Facebook", url: site.social.facebook },
    { name: "Upwork", url: site.social.upwork },
  ]
  return {
    ...site,
    whatsappUrl: `https://wa.me/${n}`,
    whatsappDisplay: `+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`,
    fullAddress: [site.address.street, site.address.locality, site.address.country].filter(Boolean).join(", "),
    socialProfiles: social.filter((profile) => profile.url !== ""),
  }
}

export const siteContact = ({ email, whatsappUrl, whatsappDisplay, mockupDays }: SiteInfo): SiteContact => ({
  email,
  whatsappUrl,
  whatsappDisplay,
  mockupDays,
})

// Replaces {token} placeholders; unknown tokens are left as they are.
export const fillTokens = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match)
