"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, ExternalLink, ArrowRight, Send } from "lucide-react"

const budgetOptions = [
  "Under $1,000",
  "$1,000 – $5,000",
  "$5,000 – $15,000",
  "$15,000+",
  "Not sure yet",
]

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    project: "",
    budget: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate submission
    setSubmitted(true)
  }

  return (
    <section id="contact" className="py-24 md:py-36 px-6 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%] bg-surface relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-[180px]" />
      </div>

      <div className="w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1.2fr] gap-16 xl:gap-24 items-start">
          {/* Left: heading + alt contacts */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
              Get In Touch
            </p>
            <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight mb-6">
              <span className="text-cream">Let&apos;s Build Something</span>
              <br />
              <span className="text-muted">Together</span>
            </h2>
            <p className="font-dm font-light text-muted mb-12 leading-relaxed text-base max-w-sm">
              Tell us about your project. We read every message and reply within 24 hours — usually faster.
            </p>

            {/* Alt contact options */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-dm text-xs text-muted mb-0.5">Prefer email?</p>
                  <a
                    href="mailto:admin@code-motive.dev"
                    className="font-dm font-medium text-cream hover:text-accent transition-colors"
                  >
                    admin@code-motive.dev
                  </a>
                </div>
              </div>

              <div className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-dm text-xs text-muted mb-0.5">On Upwork?</p>
                  <a
                    href="#"
                    className="font-dm font-medium text-cream hover:text-accent transition-colors flex items-center gap-1"
                  >
                    View our agency profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <p className="font-dm text-xs text-muted mt-6">
              We typically respond within 24 hours. No spam, no sales calls unless you ask.
            </p>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {submitted ? (
              <div className="glass rounded-3xl p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                  <Send className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-syne font-extrabold text-2xl text-cream mb-3">Message Sent!</h3>
                <p className="font-dm font-light text-muted">
                  Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="glass rounded-3xl p-8 space-y-5"
              >
                {/* Name */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="font-dm text-xs text-muted uppercase tracking-widest block mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                    className="w-full bg-bg/50 border border-accent/10 rounded-xl px-4 py-3.5 font-dm text-sm text-cream placeholder:text-muted/50 focus:outline-none focus:border-accent/40 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="font-dm text-xs text-muted uppercase tracking-widest block mb-2"
                  >
                    Your Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    className="w-full bg-bg/50 border border-accent/10 rounded-xl px-4 py-3.5 font-dm text-sm text-cream placeholder:text-muted/50 focus:outline-none focus:border-accent/40 transition-colors"
                  />
                </div>

                {/* Project */}
                <div>
                  <label
                    htmlFor="contact-project"
                    className="font-dm text-xs text-muted uppercase tracking-widest block mb-2"
                  >
                    Tell Us About Your Project
                  </label>
                  <textarea
                    id="contact-project"
                    required
                    rows={4}
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    placeholder="We need an AI automation to handle our lead follow-ups..."
                    className="w-full bg-bg/50 border border-accent/10 rounded-xl px-4 py-3.5 font-dm text-sm text-cream placeholder:text-muted/50 focus:outline-none focus:border-accent/40 transition-colors resize-none"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label
                    htmlFor="contact-budget"
                    className="font-dm text-xs text-muted uppercase tracking-widest block mb-2"
                  >
                    Budget Range
                  </label>
                  <select
                    id="contact-budget"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full bg-bg/50 border border-accent/10 rounded-xl px-4 py-3.5 font-dm text-sm text-cream focus:outline-none focus:border-accent/40 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#11100E]">Select a range…</option>
                    {budgetOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#11100E]">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="contact-submit-btn"
                  type="submit"
                  className="group w-full bg-accent text-bg font-dm font-semibold px-8 py-4 rounded-xl hover:bg-accent-soft transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent/20"
                >
                  Send Message
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
