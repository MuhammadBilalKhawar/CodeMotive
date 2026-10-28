"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { mainNav } from "@/config/site"

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    // Stop the page scrolling behind the open menu.
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKey)
      root.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

  // Close the menu after navigating.
  useEffect(() => setIsMenuOpen(false), [pathname])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const solid = isScrolled || isMenuOpen

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-[60] transition-[background-color,border-color,backdrop-filter] duration-500 border-b",
        solid ? "bg-forest/80 backdrop-blur-xl border-mint/10" : "bg-transparent border-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className="w-full px-4 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%] py-4 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center p-1 -m-1">
          {/* Icon only on small screens, full logo from sm up (brand kit: icon below 24px tall). */}
          <Image src="/brand/header-icon-dark-mode.svg" alt="CodeMotive" width={56} height={32} priority className="h-8 w-auto sm:hidden" />
          <Image
            src="/brand/header-logo-dark-mode.svg"
            alt="CodeMotive"
            width={175}
            height={32}
            priority
            className="hidden sm:block h-8 w-auto"
          />
        </Link>

        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          <ul className="flex items-center gap-1 rounded-full border border-mint/10 bg-forest-800/40 px-2 py-1.5 backdrop-blur">
            {mainNav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "relative block px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
                    isActive(link.href) ? "bg-mint/12 text-white" : "text-mint/85 hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="btn-shine group ml-3 bg-mint text-forest font-semibold text-sm px-5 py-2.5 rounded-full glow-mint transition-transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            Get a free quote
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden />
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden w-11 h-11 -mr-2 flex items-center justify-center text-mint rounded-full border border-mint/15 bg-forest-800/50 backdrop-blur"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
        </button>
      </nav>

      <div
        id="mobile-menu"
        hidden={!isMenuOpen}
        // Scrolls on its own when taller than the screen (phones in landscape).
        className="md:hidden max-h-[calc(100dvh-4.75rem)] overflow-y-auto overscroll-contain border-t border-mint/10 bg-forest/95 backdrop-blur-xl"
      >
        <ul className="px-4 pt-4 pb-6 flex flex-col">
          {mainNav.map((link, index) => (
            <li
              key={link.href}
              className="animate-in fade-in slide-in-from-top-2 fill-mode-both motion-reduce:animate-none"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between py-3.5 border-b border-mint/10 font-heading font-semibold text-lg",
                  isActive(link.href) ? "text-white" : "text-neutral",
                )}
              >
                {link.label}
                <ArrowRight className="w-4 h-4 text-sage" aria-hidden />
              </Link>
            </li>
          ))}
          <li className="mt-5">
            <Link
              href="/contact"
              className="btn-shine bg-mint text-forest font-semibold px-5 py-3.5 rounded-xl text-center flex items-center justify-center gap-2 glow-mint"
            >
              Get a free quote
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
