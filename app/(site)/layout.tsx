import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import { SiteMotion } from "@/components/motion/site-motion"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { ChatLauncher } from "@/components/chat/chat-launcher"
import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { ConsentBanner } from "@/components/analytics/consent-banner"
import { SiteContactProvider } from "@/components/site-contact"
import { siteConfig } from "@/config/site"
import { organizationId, websiteJsonLd } from "@/lib/seo"
import { getAiSettings, getSite, getTeam } from "@/lib/cms"
import { siteContact, type SiteInfo } from "@/lib/cms/site-info"
import type { TeamContent } from "@/lib/cms/schemas"

const organizationJsonLd = (site: SiteInfo, team: TeamContent) => ({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": organizationId,
  name: siteConfig.name,
  slogan: site.tagline,
  description: site.summary,
  url: siteConfig.url,
  logo: `${siteConfig.url}/android-chrome-512x512.png`,
  email: site.email,
  telephone: `+${site.whatsappNumber}`,
  address: {
    "@type": "PostalAddress",
    ...(site.address.street && { streetAddress: site.address.street }),
    addressLocality: site.address.locality,
    addressCountry: site.address.countryCode,
  },
  founder: team.map((member) => ({ "@type": "Person", name: member.name })),
  areaServed: ["Pakistan", "Worldwide"],
  sameAs: site.socialProfiles.map((profile) => profile.url),
})

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, team, ai] = await Promise.all([getSite(), getTeam(), getAiSettings()])
  return (
    <SiteContactProvider value={siteContact(site)}>
      <JsonLd data={organizationJsonLd(site, team)} />
      <JsonLd data={websiteJsonLd()} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-mint focus:text-forest focus:px-4 focus:py-2 focus:rounded-lg font-semibold"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppButton />
      {ai.chatEnabled && <ChatLauncher greeting={ai.greeting} suggestions={ai.suggestions} />}
      <ConsentBanner />
      <GoogleAnalytics />
      <SiteMotion />
    </SiteContactProvider>
  )
}
