"use client"

import { motion } from "framer-motion"

const techStack = {
  "Languages & Frameworks": [
    "React", "Next.js", "Node.js", "Python", "Flutter", "React Native",
  ],
  "Tools & Platforms": [
    "n8n", "Make.com", "OpenAI API", "Shopify", "AWS", "PostgreSQL", "MongoDB", "Docker",
  ],
}

const colorMap: Record<string, string> = {
  React: "text-cyan-400 border-cyan-400/20 bg-cyan-400/5",
  "Next.js": "text-cream border-cream/10 bg-cream/5",
  "Node.js": "text-green-400 border-green-400/20 bg-green-400/5",
  Python: "text-blue-400 border-blue-400/20 bg-blue-400/5",
  Flutter: "text-sky-400 border-sky-400/20 bg-sky-400/5",
  "React Native": "text-cyan-300 border-cyan-300/20 bg-cyan-300/5",
  "n8n": "text-orange-400 border-orange-400/20 bg-orange-400/5",
  "Make.com": "text-purple-400 border-purple-400/20 bg-purple-400/5",
  "OpenAI API": "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
  Shopify: "text-green-300 border-green-300/20 bg-green-300/5",
  AWS: "text-amber-400 border-amber-400/20 bg-amber-400/5",
  PostgreSQL: "text-indigo-400 border-indigo-400/20 bg-indigo-400/5",
  MongoDB: "text-green-500 border-green-500/20 bg-green-500/5",
  Docker: "text-blue-300 border-blue-300/20 bg-blue-300/5",
}

export function TechStack() {
  return (
    <section id="tech" className="py-24 md:py-36 px-6 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%]">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Technologies
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight">
            <span className="text-cream">Technologies We Work With</span>
          </h2>
          <p className="font-dm font-light text-muted mt-4 text-lg max-w-xl mx-auto">
            We pick the right tool for the job — not the trendy one.
          </p>
        </motion.div>

        <div className="space-y-10">
          {Object.entries(techStack).map(([category, techs], catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: catIndex * 0.15 }}
            >
              <p className="font-dm text-xs text-muted uppercase tracking-widest mb-5">
                {category}
              </p>
              <div className="flex flex-wrap gap-3">
                {techs.map((tech, i) => (
                  <motion.span
                    key={tech}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: catIndex * 0.1 + i * 0.05, duration: 0.4 }}
                    whileHover={{ scale: 1.08, y: -2, transition: { duration: 0.2 } }}
                    className={`font-dm font-medium text-sm px-4 py-2 rounded-full border cursor-default select-none ${colorMap[tech] ?? "text-muted border-muted/20 bg-muted/5"
                      }`}
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
