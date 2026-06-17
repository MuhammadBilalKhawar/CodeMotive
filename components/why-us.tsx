"use client"

import { motion } from "framer-motion"
import { Users, Zap, DollarSign, TrendingDown, HeartHandshake } from "lucide-react"

const reasons = [
  {
    icon: Users,
    title: "Direct communication",
    body: "No account managers, no middlemen. The engineers building your product are the same people on your calls.",
    number: "01",
  },
  {
    icon: Zap,
    title: "Fast delivery",
    body: "Most projects are scoped, built, and delivered in 2–6 weeks. We move like a startup because we are one.",
    number: "02",
  },
  {
    icon: DollarSign,
    title: "Transparent fixed pricing",
    body: "You get a fixed quote before we start. No hourly surprises, no scope creep invoices.",
    number: "03",
  },
  {
    icon: TrendingDown,
    title: "Startup-friendly rates",
    body: "Senior-level engineering at a fraction of what a US or UK agency charges — without compromising on quality.",
    number: "04",
  },
]

export function WhyUs() {
  return (
    <section id="why-us" className="py-24 md:py-36 px-6 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%] bg-surface relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gradient-to-bl from-accent/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Why Work With Us
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight">
            <span className="text-cream">Here is what working with</span>
            <br />
            <span className="text-muted">CodeMotive actually looks like.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.1,
              }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group glass rounded-2xl p-8 relative overflow-hidden"
            >
              {/* Number watermark */}
              <span className="absolute top-4 right-6 font-syne font-extrabold text-6xl text-accent/5 select-none pointer-events-none">
                {reason.number}
              </span>

              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Icon */}
              <div className="relative w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors duration-300">
                <reason.icon className="w-5 h-5 text-accent" />
              </div>

              <h3 className="relative font-syne font-extrabold text-lg text-cream mb-3">
                {reason.title}
              </h3>
              <p className="relative font-dm font-light text-muted text-sm leading-relaxed">
                {reason.body}
              </p>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent-soft scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
