import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { VisitorProvider } from '@/components/visitor-provider'
import { siteConfig } from '@/config/site'
import './globals.css'

// Self-hosted (Latin subset, from Fontsource) so dev and build never depend
// on fetching from Google Fonts. Montserrat: headings (600/700). Inter: body.
const montserrat = localFont({
  src: [
    { path: './fonts/montserrat-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/montserrat-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: "--font-montserrat",
  display: "swap",
})

const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: "--font-inter",
  display: "swap",
})

const description =
  'Business websites, Shopify stores, integrations and AI automation for businesses in Pakistan and worldwide. Based in Lahore. Fixed quote, clear timeline.'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description,
  authors: [{ name: siteConfig.name }],
  robots: 'index, follow',
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description,
    url: siteConfig.url,
    type: 'website',
    siteName: siteConfig.name,
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon-180x180.png', sizes: '180x180' }],
    other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: siteConfig.themeColor }],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-config': '/browserconfig.xml',
  },
}

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} bg-forest`}>
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to
          <body> before React loads. This only ignores attribute mismatches on <body>
          itself; its children are still checked. */}
      <body suppressHydrationWarning className="font-body antialiased bg-neutral text-charcoal overflow-x-hidden">
        <VisitorProvider>{children}</VisitorProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
