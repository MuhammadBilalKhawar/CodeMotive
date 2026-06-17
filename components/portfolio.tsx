"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

const projects = [
  {
    title: "AI Recruitment Platform",
    tag: "AI Automation",
    description:
      "Built a fully automated CV parsing and candidate ranking platform utilizing NLP. Integrated deepfake detection for video interviews to ensure candidate authenticity and streamline hiring.",
    tech: ["Python", "OpenAI API", "AWS", "PostgreSQL"],
    gradient: "from-[#2A1F0A] via-[#3D2E0F] to-[#2A1F0A]",
    tagColor: "text-amber-400 bg-amber-400/10",
    link: "https://remote-hire-io.vercel.app/",
    image: "/portfolio-1.png",
  },
  {
    title: "AI Code Review SaaS",
    tag: "SaaS Product",
    description:
      "Developed an LLM-powered SaaS tool for automated pull request reviews. The system achieved over 85% accuracy in catching logical bugs and highlighting security vulnerabilities before deployment.",
    tech: ["Next.js", "Node.js", "OpenAI API", "GitHub API"],
    gradient: "from-[#0A1A2A] via-[#0F2A3D] to-[#0A1A2A]",
    tagColor: "text-blue-400 bg-blue-400/10",
    link: "https://codereviewer-five.vercel.app/",
    image: "/portfolio-2.png",
  },
  {
    title: "AI Interview Evaluation System",
    tag: "Machine Learning",
    description:
      "Engineered an AI-driven evaluation system using Google Gemini to analyze interview transcripts. It automatically extracts core NLP skills and provides objective, data-backed hiring recommendations.",
    tech: ["Python", "Google Gemini", "React", "PostgreSQL"],
    gradient: "from-[#0A2A1A] via-[#0F3D2A] to-[#0A2A1A]",
    tagColor: "text-emerald-400 bg-emerald-400/10",
    link: "https://interview-ai-opal.vercel.app/",
    image: "/portfolio-3.png",
  },
]

export function Portfolio() {
  return (
    <section id="portfolio" className="py-24 md:py-36 px-6 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%]">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Our Work
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight">
            <span className="text-cream">A few things we have</span>
            <br />
            <span className="text-muted">built recently.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              key={project.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.12
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group glass rounded-2xl overflow-hidden flex flex-col block"
            >
              {/* Card visual header */}
              <div
                className={`h-44 flex items-end p-5 bg-gradient-to-br ${project.gradient} relative overflow-hidden`}
              >
                {project.image && (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 z-10">
                  <div className="w-9 h-9 rounded-full glass flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-cream" />
                  </div>
                </div>
                <span className={`relative font-dm text-xs font-medium px-3 py-1 rounded-full ${project.tagColor} z-10`}>
                  {project.tag}
                </span>
              </div>

              {/* Card body */}
              <div className="p-7 flex flex-col flex-1">
                <h3 className="font-syne font-extrabold text-lg text-cream mb-3 leading-snug">
                  {project.title}
                </h3>
                <p className="font-dm font-light text-muted text-sm leading-relaxed mb-6 flex-1">
                  {project.description}
                </p>

                {/* Tech stack badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="font-dm text-xs text-muted glass px-3 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <span
                  className="font-dm text-sm font-medium text-accent flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-300 mt-auto"
                >
                  View Project
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Bottom accent line */}
              <div className="h-0.5 bg-gradient-to-r from-accent to-accent-soft scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.a>
          ))}
        </div>

        {/* Footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="font-dm text-xs text-muted text-center mt-10"
        >
          These include sample and client projects. More work available on request.
        </motion.p>
      </div>
    </section>
  )
}
