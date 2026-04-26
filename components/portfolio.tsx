"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight, X, CheckCircle2 } from "lucide-react"
import Image from "next/image"

const projects = [
  {
    title: "Zaiqa Lahore",
    category: "Restaurant",
    tech: "Next.js, SEO, WhatsApp API",
    gradient: "from-[#3D2A14] via-[#5C3D1A] to-[#3D2A14]",
    description: "A high-conversion restaurant website with a digital menu and direct WhatsApp ordering integration.",
    results: ["Substantial growth in online orders", "Enhanced Google visibility in Lahore", "Optimized mobile ordering experience"]
  },
  {
    title: "Al-Shifa Clinic",
    category: "Medical",
    tech: "React, Booking System, Maps",
    gradient: "from-[#1A3D2D] via-[#2A5C44] to-[#1A3D2D]",
    description: "Modern healthcare portal with patient booking, automated reminders, and interactive location maps.",
    results: ["Improved patient appointment flow", "Streamlined booking management", "Secure and reliable data handling"]
  },
  {
    title: "Khawar & Associates",
    category: "Law Firm",
    tech: "Next.js, CMS, SEO",
    gradient: "from-[#252219] via-[#3D3728] to-[#252219]",
    description: "Corporate law firm website focusing on authority, trust, and lead generation through expert content.",
    results: ["Significant increase in organic traffic", "Established professional digital presence", "Efficient consultation lead generation"]
  },
  {
    title: "Bright Minds Academy",
    category: "Education",
    tech: "React, LMS, Mobile-first",
    gradient: "from-[#3D2828] via-[#5C3D3D] to-[#3D2828]",
    description: "Educational platform with student registration, course management, and interactive parent portal.",
    results: ["Simplified digital enrollment", "Robust course management system", "Seamless multi-device performance"]
  },
]

export function Portfolio() {
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null)

  return (
    <section id="work" className="py-24 md:py-36 px-5 md:px-12 bg-surface transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
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
            <span className="text-cream">Projects that drive</span>
            <br />
            <span className="text-muted">real results.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1], 
                delay: index * 0.1 
              }}
              onClick={() => setSelectedProject(project)}
              className="group glass rounded-2xl overflow-hidden cursor-pointer"
            >
              <div
                className={`h-56 md:h-64 flex items-center justify-center bg-gradient-to-br ${project.gradient} relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/20" />
                <motion.div
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 bg-gradient-to-t from-bg/90 to-transparent"
                />
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -8 }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <ArrowUpRight className="w-4 h-4 text-cream" />
                </motion.div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-syne font-extrabold text-xl text-cream">
                    {project.title}
                  </h3>
                  <span className="font-dm text-xs text-muted glass px-3 py-1 rounded-full">
                    {project.category}
                  </span>
                </div>
                <p className="font-dm font-light text-muted text-sm">
                  {project.tech}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            />
            
            <motion.div
              layoutId={selectedProject.title}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl glass rounded-3xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full glass flex items-center justify-center text-cream hover:bg-accent/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row">
                <div className={`md:w-1/2 h-64 md:h-auto bg-gradient-to-br ${selectedProject.gradient} flex items-center justify-center`}>
                  <div className="text-cream font-syne font-extrabold text-4xl opacity-20">
                    {selectedProject.title}
                  </div>
                </div>
                
                <div className="md:w-1/2 p-8 md:p-12">
                  <span className="font-dm text-xs text-accent uppercase tracking-widest mb-4 block">
                    {selectedProject.category} Case Study
                  </span>
                  <h3 className="font-syne font-extrabold text-3xl text-cream mb-6">
                    {selectedProject.title}
                  </h3>
                  <p className="font-dm font-light text-muted mb-8 leading-relaxed">
                    {selectedProject.description}
                  </p>
                  
                  <div className="space-y-4">
                    <h4 className="font-syne font-extrabold text-sm text-cream uppercase">Key Results</h4>
                    {selectedProject.results.map((result, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <p className="font-dm text-sm text-muted">{result}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 flex gap-4">
                    <a href="#contact" onClick={() => setSelectedProject(null)} className="bg-accent text-bg font-dm font-semibold px-6 py-3 rounded-xl text-sm transition-transform hover:scale-105 active:scale-95">
                      Get a Similar Result
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

