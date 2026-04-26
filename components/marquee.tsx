"use client"

import { motion } from "framer-motion"

const skills = [
  "React",
  "Next.js",
  "Tailwind CSS",
  "SEO Optimization",
  "Mobile-First Design",
  "Fast Delivery",
  "Monthly Maintenance",
  "Google Analytics",
  "WhatsApp Integration",
  "Free Hosting",
  "Node.js",
  "Vercel",
]

export function Marquee() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative py-6 overflow-hidden border-y border-accent/10"
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg to-transparent z-10" />

      <div className="animate-marquee whitespace-nowrap flex">
        {[...skills, ...skills].map((skill, index) => (
          <span
            key={index}
            className="font-dm text-muted mx-6 text-sm flex items-center gap-6"
          >
            {skill}
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </motion.div>
  )
}
