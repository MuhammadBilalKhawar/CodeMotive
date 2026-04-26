"use client"

import { motion } from "framer-motion"
import { MessageCircle, Mail, ArrowRight } from "lucide-react"

export function Contact() {
  return (
    <section id="contact" className="py-24 md:py-36 px-5 md:px-12 bg-surface relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[150px]" />
      </div>

      <div className="max-w-lg mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Get Started
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight mb-4">
            <span className="text-cream">Let&apos;s build your</span>
            <br />
            <span className="text-muted">dream website.</span>
          </h2>
          <p className="font-dm font-light text-muted mb-12">
            Ready to get started? Reach out and we&apos;ll build your free demo within 48 hours.
          </p>

          <div className="space-y-4">
            <motion.a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              className="group flex items-center justify-between w-full glass hover:bg-cream/[0.04] text-cream font-dm font-medium py-5 px-6 rounded-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Chat on WhatsApp</p>
                  <p className="text-sm text-muted">Usually responds within 1 hour</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted group-hover:text-cream group-hover:translate-x-1 transition-all" />
            </motion.a>

            <motion.a
              href="mailto:hello@code-motive.dev"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              className="group flex items-center justify-between w-full glass hover:bg-cream/[0.04] text-cream font-dm font-medium py-5 px-6 rounded-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">hello@code-motive.dev</p>
                  <p className="text-sm text-muted">For detailed inquiries</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted group-hover:text-cream group-hover:translate-x-1 transition-all" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
