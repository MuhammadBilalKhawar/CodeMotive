"use client"

import { motion } from "framer-motion"
import { Globe, TrendingUp, Wrench } from "lucide-react"

const services = [
  {
    icon: Globe,
    title: "Business Websites",
    description:
      "Professional, fast-loading websites that convert visitors into customers. Mobile-first design with SEO built in.",
    price: "Starting PKR 50,000",
  },
  {
    icon: TrendingUp,
    title: "SEO & Google Visibility",
    description:
      "Get found on Google. We optimize your site for local searches so customers in Pakistan can find you easily.",
    price: "Included in Business+",
  },
  {
    icon: Wrench,
    title: "Monthly Maintenance",
    description:
      "Keep your site updated, secure, and running smoothly. Regular backups, updates, and content changes.",
    price: "From PKR 20,000/month",
  },
]

export function Services() {
  return (
    <section id="services" className="py-24 md:py-36 px-5 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Our Services
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight">
            <span className="text-cream">Everything you need to</span>
            <br />
            <span className="text-muted">grow online.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1], 
                delay: index * 0.12 
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group glass rounded-2xl p-8 relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Icon container */}
              <div className="relative mb-6">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                  <service.icon className="w-6 h-6 text-accent" />
                </div>
              </div>

              <h3 className="relative font-syne font-extrabold text-xl md:text-2xl mb-3 text-cream">
                {service.title}
              </h3>
              <p className="relative font-dm font-light text-muted mb-6 leading-relaxed">
                {service.description}
              </p>
              <p className="relative font-dm font-semibold text-accent text-sm">
                {service.price}
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
