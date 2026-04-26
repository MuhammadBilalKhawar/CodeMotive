"use client"

import { motion } from "framer-motion"

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-8 px-5 md:px-12 border-t border-accent/10"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-dm text-sm text-muted">
          &copy; {new Date().getFullYear()} CodeMotive. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a href="#services" className="font-dm text-sm text-muted hover:text-cream transition-colors">
            Services
          </a>
          <a href="#work" className="font-dm text-sm text-muted hover:text-cream transition-colors">
            Work
          </a>
          <a href="#contact" className="font-dm text-sm text-muted hover:text-cream transition-colors">
            Contact
          </a>
        </div>
      </div>
    </motion.footer>
  )
}
