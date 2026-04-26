"use client"

import { motion } from "framer-motion"
import { Quote } from "lucide-react"

const testimonials = [
  {
    name: "Muhammad Usman",
    role: "Owner, Zaiqa Lahore",
    content: "CodeMotive transformed our online presence. Our delivery orders increased by 40% within the first month of launching the new site.",
    image: "/api/placeholder/100/100"
  },
  {
    name: "Dr. Sarah Ahmed",
    role: "Director, Al-Shifa Clinic",
    content: "The professional design and seamless booking integration have made a huge difference for our patients. Highly recommended for any medical practice.",
    image: "/api/placeholder/100/100"
  },
  {
    name: "Ayesha Khan",
    role: "Founder, Bright Minds Academy",
    content: "Fast, reliable, and extremely talented. They understood our requirements perfectly and delivered a beautiful site in record time.",
    image: "/api/placeholder/100/100"
  }
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 md:py-36 px-5 md:px-12 bg-surface/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Testimonials
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight text-cream">
            What our clients say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass p-10 rounded-3xl relative"
            >
              <Quote className="absolute top-8 right-8 w-12 h-12 text-accent/10" />
              <div className="relative z-10">
                <p className="font-dm font-light text-muted text-lg mb-8 leading-relaxed italic">
                  "{t.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center font-syne font-extrabold text-accent">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-syne font-extrabold text-cream">{t.name}</h4>
                    <p className="font-dm text-xs text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
