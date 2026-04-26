"use client"

import { motion } from "framer-motion"

const skills = ["React", "Next.js", "Tailwind CSS", "Node.js", "SEO", "Vercel"]

const highlights = [
  { label: "Code Quality", value: "A+" },
  { label: "Performance", value: "100" },
  { label: "Architecture", value: "Production" },
  { label: "SEO Score", value: "90+" },
]

export function About() {
  return (
    <section id="about" className="py-24 md:py-36 px-5 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="glass rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-soft flex items-center justify-center font-syne font-extrabold text-2xl text-bg shadow-lg shadow-accent/20"
                >
                  MK
                </motion.div>
                <div>
                  <h3 className="font-syne font-extrabold text-xl text-cream">
                    Muhammad Bilal Khawar
                  </h3>
                  <p className="font-dm font-light text-muted">
                    Software Engineer
                  </p>
                </div>
              </div>

              <p className="font-dm font-light text-muted leading-relaxed mb-8">
                I am a software engineer dedicated to building production-grade digital experiences. I specialize in engineering high-performance, scalable websites that solve real business problems with clean, maintainable code.
              </p>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="glass text-muted text-xs font-dm px-3 py-1.5 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="hidden md:flex absolute -top-6 -right-6 glass rounded-xl p-4 flex-col items-center"
              style={{ animation: "flow 4s ease-in-out infinite" }}
            >
              <p className="font-syne font-extrabold text-2xl text-accent">Clean</p>
              <p className="font-dm text-xs text-muted">Architecture</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="hidden md:flex absolute -bottom-6 -left-6 glass rounded-xl p-4 flex-col items-center"
              style={{ animation: "flow 4s ease-in-out infinite 2s" }}
            >
              <p className="font-syne font-extrabold text-2xl text-accent-soft">Fast</p>
              <p className="font-dm text-xs text-muted">Core Vitals</p>
            </motion.div>
          </motion.div>

          {/* Right - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
              About CodeMotive
            </p>
            <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight mb-6">
              <span className="text-cream">Lahore-based,</span>
              <br />
              <span className="text-muted">globally inspired.</span>
            </h2>

            <p className="font-dm font-light text-muted leading-relaxed mb-4">
              CodeMotive was founded with a simple mission: to give Pakistani businesses the same quality websites that international companies enjoy, at prices that make sense locally.
            </p>
            <p className="font-dm font-light text-muted leading-relaxed mb-10">
              We don&apos;t believe in templates or shortcuts. Every project is custom-built with modern technologies, optimized for speed, and designed to convert visitors into customers.
            </p>

            <div className="grid grid-cols-2 gap-8">
              {highlights.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="relative pl-4 border-l-2 border-accent/30"
                >
                  <p className="font-syne font-extrabold text-2xl text-cream">
                    {item.value}
                  </p>
                  <p className="font-dm font-light text-muted text-sm">
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
