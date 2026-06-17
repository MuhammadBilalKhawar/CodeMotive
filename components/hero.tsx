"use client"

import { motion } from "framer-motion"
import { ArrowRight, ChevronDown, MapPin } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import { DynamicBg } from "./dynamic-bg"

const slideIn = {
  hidden: { opacity: 0, x: -80 },
  show: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}
const slideInRight = {
  hidden: { opacity: 0, x: 80 },
  show: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
}

export function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <DynamicBg />

      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-accent/[0.08] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gradient-to-tr from-cream/[0.02] via-transparent to-transparent" />
      </div>

      {/* Vertical lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <motion.div
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-[12%] top-0 w-px h-full bg-gradient-to-b from-transparent via-accent/10 to-transparent origin-top"
        />
        <motion.div
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 1.4, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-[88%] top-0 w-px h-full bg-gradient-to-b from-transparent via-accent/10 to-transparent origin-top"
        />
      </div>

      {/* Full-width fluid container */}
      <div className="relative z-10 w-full px-6 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:gap-12 2xl:gap-20">

          {/* LEFT: Text */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="xl:flex-1"
          >
            {/* Badge */}
            <motion.div variants={slideIn}>
              <div className="inline-flex items-center gap-3 glass-light rounded-full px-5 py-2.5 mb-10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                </span>
                <span className="font-dm text-sm text-accent font-medium">CodeMotive — We Code. You Grow.</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={slideIn}
              className="font-syne font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-6xl 2xl:text-7xl tracking-tight leading-[1.05] mb-8"
            >
              <span className="text-cream">We Build AI-Powered Software for Businesses </span>
              <span className="text-accent">That Want to Move Faster</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={slideInRight}
              className="font-dm font-light text-muted text-lg xl:text-base 2xl:text-lg max-w-2xl xl:max-w-lg 2xl:max-w-xl mb-10 leading-relaxed"
            >
              CodeMotive is a Lahore-based software house helping US, UK, and UAE startups and SMBs automate workflows, build web and mobile apps, and ship faster — at rates that make sense.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-8">
              <MagneticButton>
                <a
                  id="hero-see-work-btn"
                  href="#portfolio"
                  className="group relative bg-accent text-bg font-dm font-semibold px-8 py-4 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 flex items-center gap-2"
                >
                  <span className="relative z-10">See Our Work</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <motion.div
                    className="absolute inset-0 bg-accent-soft"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </a>
              </MagneticButton>

              <MagneticButton strength={0.3}>
                <a
                  id="hero-consultation-btn"
                  href="#contact"
                  className="glass-light text-cream font-dm font-medium px-8 py-4 rounded-xl hover:bg-cream/[0.05] transition-colors duration-300 flex items-center gap-2"
                >
                  Get a Free Consultation
                  <ArrowRight className="w-4 h-4 opacity-60" />
                </a>
              </MagneticButton>
            </motion.div>

            {/* Trust line */}
            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="font-dm text-sm text-muted leading-relaxed">
                Based in Lahore, Pakistan — working with clients globally
              </span>
            </motion.div>
          </motion.div>

          {/* RIGHT: Stat cards — xl+ only */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden xl:flex xl:flex-1 flex-col gap-5"
          >
            {[
              { value: "4–6 weeks", label: "Average project delivery", sub: "From scoping to deployed product" },
              { value: "10–40 hrs/wk", label: "Saved via AI automation", sub: "Eliminating manual busywork" },
              { value: "US · UK · UAE", label: "Client markets served", sub: "Startup-friendly rates, senior-level quality" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-2xl px-7 py-6 flex items-center gap-5 hover:border-accent/20 transition-colors duration-300"
              >
                <div className="flex-shrink-0 w-1 h-12 rounded-full bg-gradient-to-b from-accent to-accent-soft opacity-70" />
                <div>
                  <p className="font-syne font-extrabold text-2xl xl:text-xl 2xl:text-2xl text-cream leading-none mb-1">{stat.value}</p>
                  <p className="font-dm font-medium text-sm text-accent">{stat.label}</p>
                  <p className="font-dm font-light text-xs text-muted mt-0.5">{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Stats row — mobile/tablet only */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="flex xl:hidden flex-wrap gap-10 md:gap-16 mt-16 mb-8"
        >
          {[
            { value: "4–6 wks", label: "Avg. Delivery" },
            { value: "10–40h", label: "Saved/Week" },
            { value: "3 Markets", label: "US · UK · UAE" },
          ].map((stat, i) => (
            <div key={stat.label} className="relative">
              <p className="font-syne font-extrabold text-3xl md:text-4xl text-cream">{stat.value}</p>
              <p className="font-dm font-light text-muted text-sm mt-1">{stat.label}</p>
              {i < 2 && <div className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 w-px h-10 bg-accent/20" />}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-dm text-xs text-muted tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 text-accent" />
        </motion.div>
      </motion.div>
    </section>
  )
}
