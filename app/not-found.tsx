import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DarkDecor, buttonStyles, gutter } from "@/components/section"
import { services } from "@/data/services"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className={`relative overflow-hidden bg-forest ${gutter} pt-40 pb-24 min-h-[80vh]`}>
        <DarkDecor />
        <div className="relative max-w-3xl">
          <p className="eyebrow text-mint mb-5">Error 404</p>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl tracking-tight text-white mb-6">
            This page doesn&apos;t exist.
          </h1>
          <p className="text-lg text-mint leading-relaxed mb-10">
            The link may be old or mistyped. Here&apos;s where most people are heading:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="glass gradient-border flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-neutral hover:text-white"
                >
                  {service.name}
                  <ArrowRight className="w-4 h-4 text-mint" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Link href="/pricing" className="glass gradient-border flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-neutral hover:text-white">
                Pricing
                <ArrowRight className="w-4 h-4 text-mint" aria-hidden />
              </Link>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className={buttonStyles.primaryOnDark}>
              Back to the homepage
            </Link>
            <Link href="/contact" className={buttonStyles.secondaryOnDark}>
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
