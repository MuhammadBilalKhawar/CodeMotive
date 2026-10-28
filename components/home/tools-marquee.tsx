import { Pause, Play } from "lucide-react"
import { gutter } from "@/components/section"

// Tools and platforms we build with (a capability list, not client logos).
const tools = [
  "Next.js",
  "React",
  "Node.js",
  "MongoDB",
  "Shopify",
  "Stripe",
  "PayPal",
  "WhatsApp Business",
  "Google Maps",
  "HubSpot",
  "Zoho",
  "Resend",
  "n8n",
  "Zapier",
  "Vercel",
  "Tailwind CSS",
]

export function ToolsMarquee() {
  return (
    <div className="relative border-t border-mint/10 py-6">
      <div className={`${gutter} flex items-center justify-between gap-4 mb-4`}>
        <p className="eyebrow text-xs text-mint/85">Tools we build with</p>
        {/* Moving content needs a way to stop it (WCAG 2.2.2). SiteMotion wires it up
            and pauses every looping animation; nothing loops with reduced motion. */}
        <button
          type="button"
          data-motion-toggle
          data-paused="false"
          className="group motion-reduce:hidden inline-flex min-h-8 items-center gap-1.5 rounded-full border border-mint/15 bg-forest-800/60 px-3 py-1 text-xs font-semibold text-mint transition-colors hover:border-mint/40 hover:text-white"
        >
          <Pause className="w-3.5 h-3.5 group-data-[paused=true]:hidden" aria-hidden />
          <Play className="w-3.5 h-3.5 hidden group-data-[paused=true]:block" aria-hidden />
          <span className="group-data-[paused=true]:hidden">Pause motion</span>
          <span className="hidden group-data-[paused=true]:inline">Play motion</span>
        </button>
      </div>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        {/* Two copies of the list so the loop is seamless; the copy is hidden from screen readers. */}
        <div data-marquee className="flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-3 pr-3">
              {tools.map((tool) => (
                <li
                  key={tool}
                  className="whitespace-nowrap rounded-full border border-mint/10 bg-forest-800/60 px-4 py-2 text-sm font-medium text-mint"
                >
                  {tool}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
