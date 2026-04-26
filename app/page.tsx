import { CustomCursor } from "@/components/custom-cursor"
import { Loader } from "@/components/loader"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Marquee } from "@/components/marquee"
import { Services } from "@/components/services"
import { Portfolio } from "@/components/portfolio"
import { Process } from "@/components/process"
import { Pricing } from "@/components/pricing"
import { About } from "@/components/about"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

import { Testimonials } from "@/components/testimonials"
import { FAQ } from "@/components/faq"

export default function Home() {
  return (
    <>
      <Loader />
      <CustomCursor />
      {/* Noise texture overlay */}
      <div className="noise-bg" />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Services />
        <Portfolio />
        <Process />
        <Testimonials />
        <Pricing />
        <FAQ />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

