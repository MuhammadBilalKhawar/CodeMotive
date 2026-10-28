"use client"

import { createContext, useContext } from "react"
import { siteConfig } from "@/config/site"
import type { SiteContact } from "@/lib/cms/site-info"

// Contact details from the admin's site settings, for client components
// (chat panel, form error messages). Provided by the site layout.
const SiteContactContext = createContext<SiteContact>({
  email: siteConfig.email,
  whatsappUrl: siteConfig.whatsapp.url,
  whatsappDisplay: siteConfig.whatsapp.display,
  mockupDays: 3,
})

export function SiteContactProvider({ value, children }: { value: SiteContact; children: React.ReactNode }) {
  return <SiteContactContext.Provider value={value}>{children}</SiteContactContext.Provider>
}

export const useSiteContact = () => useContext(SiteContactContext)
