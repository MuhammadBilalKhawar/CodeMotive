import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const syne = Syne({ 
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-syne"
})

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm"
})

export const metadata: Metadata = {
  title: 'CodeMotive — Premium Web Development & SEO Lahore, Pakistan',
  description: 'CodeMotive builds high-performance, premium websites and digital experiences for Pakistani businesses. Expert in Next.js, SEO, and results-driven design. Best web developer in Lahore.',
  keywords: 'CodeMotive, web development Lahore, website design Pakistan, best web developer Lahore, Muhammad Bilal Khawar, professional websites Lahore, SEO Pakistan, Next.js developer Pakistan, high-end portfolio websites',
  authors: [{ name: 'Muhammad Bilal Khawar' }],
  robots: 'index, follow',
  openGraph: {
    title: 'CodeMotive — Premium Web Development Lahore',
    description: 'Professional, high-performance websites for Pakistani businesses. See your demo before you pay. Expert SEO and design.',
    url: 'https://code-motive.dev',
    type: 'website',
    siteName: 'CodeMotive',
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeMotive — Web Development Lahore',
    description: 'High-end websites for Pakistani businesses. Free demo before you pay.',
  },
  alternates: {
    canonical: 'https://code-motive.dev',
  },
}

import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} bg-bg`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": "CodeMotive",
              "founder": "Muhammad Bilal Khawar",
              "url": "https://code-motive.dev",
              "email": "hello@code-motive.dev",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Lahore",
                "addressCountry": "PK"
              },
              "description": "Professional web development firm in Lahore, Pakistan. Websites, SEO, and digital presence for businesses.",
              "serviceType": ["Web Development", "SEO", "Website Maintenance"],
              "areaServed": "Pakistan"
            })
          }}
        />
      </head>

      <body className="font-dm antialiased bg-bg text-cream overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}

