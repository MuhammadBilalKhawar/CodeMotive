import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"
import { getSite } from "@/lib/cms"
import { Section, buttonStyles } from "@/components/section"

type CtaBandProps = {
  title?: string
  text?: string
  href?: string
  label?: string
}

export async function CtaBand({
  title = "Have a project in mind?",
  text = "Tell us what you need and we'll send a fixed quote.",
  href = "/contact",
  label = "Get a free quote",
}: CtaBandProps) {
  const { whatsappUrl } = await getSite()
  return (
    <Section tone="dark">
      <div data-reveal className="glass gradient-border rounded-[2rem] px-6 py-14 sm:px-12 md:py-20 text-center max-w-5xl mx-auto">
        <h2 className="font-heading font-bold text-3xl md:text-5xl tracking-tight text-white mb-5">{title}</h2>
        <p className="text-mint text-lg md:text-xl mb-10 max-w-2xl mx-auto">{text}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={href} className={`group ${buttonStyles.primaryOnDark}`}>
            {label}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
          </Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondaryOnDark}>
            <MessageCircle className="w-4 h-4" aria-hidden />
            Message us on WhatsApp
          </a>
        </div>
      </div>
    </Section>
  )
}
