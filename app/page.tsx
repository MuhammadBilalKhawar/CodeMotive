import { Loader } from "@/components/loader"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Marquee } from "@/components/marquee"
import { Services } from "@/components/services"
import { WhyUs } from "@/components/why-us"
import { Portfolio } from "@/components/portfolio"
import { TechStack } from "@/components/tech-stack"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <Loader />
      <div className="noise-bg" />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Services />
        <WhyUs />
        <Portfolio />
        <TechStack />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
