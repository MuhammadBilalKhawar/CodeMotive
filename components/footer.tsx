"use client"

import { motion } from "framer-motion"
import { Linkedin, ExternalLink } from "lucide-react"

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-12 px-6 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%] border-t border-accent/10"
    >
      <div className="w-full">
        {/* Main footer row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Left: Brand */}
          <div>
            <a href="#" className="font-syne font-extrabold text-xl inline-block mb-3">
              <span className="text-cream">Code</span>
              <span className="text-accent">Motive</span>
            </a>
            <p className="font-dm font-light text-muted text-sm leading-relaxed max-w-xs">
              Building software that works — from Lahore to the world.
            </p>
          </div>

          {/* Center: Nav links */}
          <div className="flex flex-col gap-3">
            <p className="font-dm text-xs text-muted uppercase tracking-widest mb-1">Navigation</p>
            <a href="#services" className="font-dm text-sm text-muted hover:text-cream transition-colors w-fit">
              Services
            </a>
            <a href="#portfolio" className="font-dm text-sm text-muted hover:text-cream transition-colors w-fit">
              Our Work
            </a>
            <a href="#contact" className="font-dm text-sm text-muted hover:text-cream transition-colors w-fit">
              Contact
            </a>
          </div>

          {/* Right: Social */}
          <div className="flex flex-col gap-3">
            <p className="font-dm text-xs text-muted uppercase tracking-widest mb-1">Connect</p>
            <a
              href="#"
              className="font-dm text-sm text-muted hover:text-cream transition-colors flex items-center gap-2 w-fit"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </a>
            <a
              href="#"
              className="font-dm text-sm text-muted hover:text-cream transition-colors flex items-center gap-2 w-fit"
            >
              <ExternalLink className="w-4 h-4" />
              Upwork
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-accent/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-dm text-xs text-muted">
            © 2026 CodeMotive. All rights reserved.
          </p>
          <p className="font-dm text-xs text-muted">
            Lahore, Pakistan.
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
