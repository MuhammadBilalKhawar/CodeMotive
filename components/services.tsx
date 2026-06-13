"use client"

import { motion } from "framer-motion"
import { Bot, Code2, ArrowRight } from "lucide-react"

const services = [
  {
    icon: Bot,
    tag: "AI Automation",
    title: "AI Workflow Automation",
    description:
      "We design and build automated pipelines that eliminate repetitive manual work from your business. Lead follow-ups, data entry, report generation, customer support routing — we connect your tools and let the machines handle the rest. Built using n8n, Make.com, Zapier, and custom AI agents powered by OpenAI.",
    result: "Save your team 10–40 hours every week.",
    gradient: "from-amber-500/10 to-orange-600/5",
    accentGlow: "group-hover:shadow-amber-500/10",
  },
  {
    icon: Code2,
    tag: "Web & Mobile",
    title: "Custom Web & Mobile Development",
    description:
      "From idea to deployed product. We build full-stack web applications and cross-platform mobile apps for startups and SMBs who need clean, fast, and scalable software without the cost of a full in-house team. We work in React, Node.js, Python, Flutter, and React Native.",
    result: "Your MVP, built and shipped in 4–6 weeks.",
    gradient: "from-blue-500/10 to-indigo-600/5",
    accentGlow: "group-hover:shadow-blue-500/10",
  },
]

export function Services() {
  return (
    <section id="services" className="py-24 md:py-36 px-6 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%]">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            What We Build
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight">
            <span className="text-cream">We specialize in two things</span>
            <br />
            <span className="text-muted">and we do them well.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-16">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.15
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`group glass rounded-2xl p-8 relative overflow-hidden transition-shadow duration-500 ${service.accentGlow}`}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Tag */}
              <div className="relative mb-6 flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                  <service.icon className="w-6 h-6 text-accent" />
                </div>
                <span className="font-dm text-xs text-accent uppercase tracking-widest glass px-3 py-1 rounded-full h-fit">
                  {service.tag}
                </span>
              </div>

              <h3 className="relative font-syne font-extrabold text-xl md:text-2xl mb-4 text-cream">
                {service.title}
              </h3>
              <p className="relative font-dm font-light text-muted mb-8 leading-relaxed text-sm md:text-base">
                {service.description}
              </p>

              {/* Result callout */}
              <div className="relative flex items-center gap-3 pt-6 border-t border-accent/10">
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <p className="font-dm font-semibold text-accent text-sm">
                  {service.result}
                </p>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent-soft scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
