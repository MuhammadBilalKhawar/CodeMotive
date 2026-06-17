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
  title: 'CodeMotive | We Code. You Grow.',
  description: 'CodeMotive builds high-performance, premium websites and AI-powered software for businesses. We code. You grow. Expert Next.js, SEO, and AI automation.',
  keywords: 'CodeMotive, web development Lahore, website design Pakistan, best web developer Lahore, AI automation, custom software development, Next.js developer',
  authors: [{ name: 'CodeMotive Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'CodeMotive | We Code. You Grow.',
    description: 'Professional, high-performance websites and AI-powered software for modern businesses. Fast delivery, transparent pricing.',
    url: 'https://code-motive.dev',
    type: 'website',
    siteName: 'CodeMotive',
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeMotive | We Code. You Grow.',
    description: 'High-end websites and AI software for businesses. Fast delivery, fixed pricing.',
  },
  alternates: {
    canonical: 'https://code-motive.dev',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
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
              "description": "CodeMotive builds high-performance, premium websites and AI-powered software for businesses. We build AI-powered software for businesses that want to move faster.",
              "serviceType": ["AI Workflow Automation", "Custom Web & Mobile App Development"],
              "areaServed": "Global"
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

