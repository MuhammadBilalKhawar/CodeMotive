"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"

const faqs = [
  {
    question: "How long does the free demo take?",
    answer: "We typically build your free working demo within 48-72 hours. You'll get a live link to test and review before committing to anything."
  },
  {
    question: "What happens after the 30 days of free support?",
    answer: "After the initial support period, we offer affordable maintenance packages to keep your site updated, secure, and performing at its best. You can also choose to manage it yourself."
  },
  {
    question: "Do I need to provide the content?",
    answer: "We can help with professional copywriting and stock images if you don't have them. Our goal is to make the process as hands-off for you as possible."
  },
  {
    question: "Is the website SEO optimized?",
    answer: "Yes, every site we build includes fundamental SEO best practices—fast loading speeds, mobile-first design, and proper meta tags to help you rank in Google."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 md:py-36 px-5 md:px-12 bg-bg">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <p className="font-dm font-medium uppercase tracking-[0.2em] text-xs text-accent mb-4">
            Questions
          </p>
          <h2 className="font-syne font-extrabold text-3xl md:text-5xl tracking-tight text-cream">
            Common Inquiries
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left"
              >
                <span className="font-syne font-extrabold text-lg text-cream pr-8">
                  {faq.question}
                </span>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  {openIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-8 md:px-8 md:pb-10 pt-0">
                      <p className="font-dm font-light text-muted leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
