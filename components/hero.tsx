"use client"

import { motion } from "framer-motion"
import { ArrowRight, ChevronDown } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import { DynamicBg } from "./dynamic-bg"

const slideIn = {
  hidden: { opacity: 0, x: -80 },
  show: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } 
  },
}

const slideInRight = {
  hidden: { opacity: 0, x: 80 },
  show: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } 
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } 
  },
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.4 },
  },
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      <DynamicBg />
      
      {/* Warm ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-accent/[0.06] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gradient-to-tr from-cream/[0.02] via-transparent to-transparent" />
      </div>

      {/* Subtle vertical lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-[12%] top-0 w-px h-full bg-gradient-to-b from-transparent via-accent/10 to-transparent origin-top"
        />
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.4, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-[88%] top-0 w-px h-full bg-gradient-to-b from-transparent via-accent/10 to-transparent origin-top"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12 w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-5xl"
        >
          {/* Availability badge */}
          <motion.div variants={slideIn}>
            <div className="inline-flex items-center gap-3 glass-light rounded-full px-5 py-2.5 mb-10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
              </span>
              <span className="font-dm text-sm text-accent">
                Available in Lahore
              </span>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={slideIn}
            className="font-syne font-extrabold text-4xl md:text-6xl lg:text-[5.5rem] tracking-tight leading-[1.05] mb-8"
          >
            <span className="block text-cream">We build websites</span>
            <span className="block text-muted">that get you</span>
            <span className="block text-accent">real customers.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={slideInRight}
            className="font-dm font-light text-muted text-lg md:text-xl max-w-xl mb-10 leading-relaxed"
          >
            Professional, high-performance websites for Pakistani businesses. Expert SEO. Premium quality.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-20">
            <MagneticButton>
              <a
                href="#contact"
                className="group relative bg-accent text-bg font-dm font-semibold px-8 py-4 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 flex items-center gap-2"
              >
                <span className="relative z-10">Get Free Demo</span>
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
                href="#work"
                className="glass-light text-cream font-dm font-medium px-8 py-4 rounded-xl hover:bg-cream/[0.05] transition-colors duration-300 flex items-center"
              >
                See Work
              </a>
            </MagneticButton>
          </motion.div>


          {/* Stats row */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap gap-10 md:gap-16"
          >
            {[
              { value: "Clean", label: "Architecture" },
              { value: "Production", label: "Ready" },
              { value: "Fast", label: "Core Vitals" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <p className="font-syne font-extrabold text-3xl md:text-4xl text-cream">
                  {stat.value}
                </p>
                <p className="font-dm font-light text-muted text-sm mt-1">
                  {stat.label}
                </p>
                {index < 2 && (
                  <div className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 w-px h-10 bg-accent/20" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
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
