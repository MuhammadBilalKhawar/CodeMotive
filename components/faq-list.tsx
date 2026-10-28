import { Plus } from "lucide-react"
import type { FaqItem } from "@/data/faq"

// Native <details> so answers work without JavaScript and stay in the HTML for crawlers.
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div data-reveal-group className="space-y-3 max-w-3xl">
      {items.map((item) => (
        <details
          key={item.question}
          className="group gradient-border gradient-border-light rounded-2xl bg-white px-6 py-5 open:shadow-lift transition-shadow"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-heading font-semibold text-lg text-forest [&::-webkit-details-marker]:hidden">
            {item.question}
            <span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-mint/50 flex items-center justify-center transition-[transform,background-color] duration-300 group-open:rotate-45 group-open:bg-forest group-open:text-mint">
              <Plus className="w-4 h-4" aria-hidden />
            </span>
          </summary>
          <p className="mt-3 pr-10 leading-relaxed text-charcoal/90">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
