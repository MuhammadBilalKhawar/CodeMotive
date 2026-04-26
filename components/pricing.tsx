"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "PKR 50,000",
    description: "Perfect for small businesses getting started online.",
    features: [
      "5-page responsive website",
      "Mobile-first design",
      "Basic SEO setup",
      "Contact form",
      "WhatsApp button",
      "1 month free support",
    ],
    featured: false,
  },
  {
    name: "Business",
    price: "PKR 90,000",
    description: "Most popular. Everything you need to grow online.",
    features: [
      "10-page responsive website",
      "Premium design",
      "Full SEO optimization",
      "Google Analytics",
      "Social media integration",
      "Admin panel (optional)",
      "3 months free support",
    ],
    featured: true,
  },
  {
    name: "Premium",
    price: "PKR 150,000+",
    description: "Custom solutions for larger businesses.",
    features: [
      "Unlimited pages",
      "Custom functionality",
      "E-commerce ready",
      "Priority support",
      "Monthly maintenance",
      "Performance optimization",
      "Dedicated account manager",
    ],
    featured: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-36 px-5 md:px-12 bg-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Pricing
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight mb-4">
            <span className="text-cream">Transparent pricing,</span>
            <br />
            <span className="text-muted">no hidden fees.</span>
          </h2>
          <p className="font-dm font-light text-muted max-w-xl mx-auto">
            Every project starts with a free demo. You only pay when you love what you see.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1], 
                delay: index * 0.12 
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`relative rounded-2xl p-8 ${
                plan.featured
                  ? "glass border border-accent/30"
                  : "glass"
              }`}
            >
              {plan.featured && (
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(232, 168, 48, 0)",
                      "0 0 50px 8px rgba(232, 168, 48, 0.12)",
                      "0 0 0 0 rgba(232, 168, 48, 0)",
                    ],
                  }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                />
              )}

              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-xs font-dm font-bold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h3 className="font-syne font-extrabold text-xl mb-2 text-cream">{plan.name}</h3>
              <p className="font-syne font-extrabold text-3xl md:text-4xl text-cream mb-2">
                {plan.price}
              </p>
              <p className="font-dm font-light text-muted text-sm mb-8">
                {plan.description}
              </p>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-accent" />
                    </span>
                    <span className="font-dm font-light text-muted text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-dm font-semibold transition-all duration-300 ${
                  plan.featured
                    ? "bg-accent text-bg hover:bg-accent-soft"
                    : "glass text-cream hover:bg-accent/10"
                }`}
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
