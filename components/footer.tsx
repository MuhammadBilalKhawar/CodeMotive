import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle } from "lucide-react"
import { mainNav, siteConfig } from "@/config/site"
import { getIndustries, getPublishedPosts, getServices, getSite } from "@/lib/cms"
import type { SocialName } from "@/lib/cms/site-info"
import { CookieSettingsButton } from "@/components/analytics/consent-banner"

const socialIcons: Record<SocialName, typeof Linkedin> = {
  LinkedIn: Linkedin,
  Instagram: Instagram,
  Facebook: Facebook,
  Upwork: ExternalLink,
}

const linkClass = "text-sm text-mint/85 hover:text-white transition-colors w-fit"

export async function Footer() {
  const year = new Date().getFullYear()
  const [site, services, industries, posts] = await Promise.all([getSite(), getServices(), getIndustries(), getPublishedPosts()])

  return (
    <footer className="bg-forest border-t border-sage/20 px-4 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%] pt-14 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_1fr_0.8fr_1.3fr] gap-10 mb-12">
        <div>
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/brand/footer-logo-stacked-dark-mode.svg"
              alt="CodeMotive"
              width={134}
              height={80}
              className="h-20 w-auto"
            />
          </Link>
          <p className="eyebrow text-mint mb-3">{site.tagline}</p>
          <p className="text-sm text-mint/85 leading-relaxed max-w-xs">
            Websites, online stores and automations for businesses in Pakistan and worldwide.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="eyebrow text-mint mb-1">Services</p>
          {services.map((service) => (
            <Link key={service.slug} href={`/services/${service.slug}`} className={linkClass}>
              {service.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="eyebrow text-mint mb-1">Industries</p>
          {industries.map((industry) => (
            <Link key={industry.slug} href={`/industries/${industry.slug}`} className={linkClass}>
              {industry.short}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="eyebrow text-mint mb-1">Company</p>
          {mainNav.filter((link) => link.href !== "/services").map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
          {posts.length > 0 && (
            <Link href="/blog" className={linkClass}>
              Guides
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="eyebrow text-mint mb-1">Contact</p>
          <p className="text-sm text-mint/85 flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-sage" aria-hidden />
            {site.fullAddress}
          </p>
          <a href={`mailto:${site.email}`} className={`${linkClass} flex items-center gap-2`}>
            <Mail className="w-4 h-4 shrink-0 text-sage" aria-hidden />
            {site.email}
          </a>
          <a
            href={site.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} flex items-center gap-2`}
          >
            <MessageCircle className="w-4 h-4 shrink-0 text-sage" aria-hidden />
            WhatsApp {site.whatsappDisplay}
          </a>
          {site.socialProfiles.length > 0 && (
            <>
              <p className="eyebrow text-mint mt-4 mb-1">Find us on</p>
              {site.socialProfiles.map((profile) => {
                const Icon = socialIcons[profile.name]
                return (
                  <a
                    key={profile.name}
                    href={profile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkClass} flex items-center gap-2`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-sage" aria-hidden />
                    {profile.name}
                  </a>
                )
              })}
            </>
          )}
        </div>

      </div>

      <div className="pt-6 border-t border-sage/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-mint/85">
        <p>
          © {year} {siteConfig.name}. All rights reserved.
        </p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <CookieSettingsButton className="hover:text-white transition-colors" />
        </div>
      </div>
    </footer>
  )
}
