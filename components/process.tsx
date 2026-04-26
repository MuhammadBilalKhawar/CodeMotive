"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Free Demo Built",
    description: "We build a working demo of your website before you pay anything. See it, test it, love it.",
  },
  {
    number: "02",
    title: "Approve & Pay 50%",
    description: "Happy with the demo? Approve it and pay 50% to start the full development.",
  },
  {
    number: "03",
    title: "Built in 5-7 Days",
    description: "Your full website is developed with all features, content, and optimizations.",
  },
  {
    number: "04",
    title: "Live & Handed Over",
    description: "We deploy your site, hand over all credentials, and provide 30 days free support.",
  },
]

export function Process() {
  return (
    <section id="process" className="py-24 md:py-36 px-5 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Our Process
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight">
            <span className="text-cream">Simple, transparent,</span>
            <br />
            <span className="text-muted">risk-free.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1], 
                delay: index * 0.12 
              }}
              className="relative group"
            >
              {/* Connector line */}
              {index < 3 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + index * 0.2, duration: 0.8 }}
                    className="w-full h-px bg-gradient-to-r from-accent/30 to-transparent origin-left"
                  />
                </div>
              )}

              <div className="glass rounded-2xl p-8 h-full relative overflow-hidden">
                {/* Large ghost number */}
                <span className="absolute -top-4 -right-2 font-syne font-extrabold text-[8rem] text-accent/[0.03] leading-none select-none">
                  {step.number}
                </span>

                <div className="relative z-10">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent font-syne font-extrabold text-sm mb-6">
                    {step.number}
                  </span>
                  <h3 className="font-syne font-extrabold text-lg md:text-xl mb-3 text-cream">
                    {step.title}
                  </h3>
                  <p className="font-dm font-light text-muted text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
