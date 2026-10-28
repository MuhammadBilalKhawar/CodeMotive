import Link from "next/link"
import { ArrowUpRight, Bot, Check, Plug, ShieldCheck, ShoppingBag, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Service } from "@/data/services"
import { pickPackages, type PricingPackage } from "@/data/pricing"
import { StartingFrom } from "@/components/price"

export const serviceIcons: Record<string, typeof Store> = {
  websites: Store,
  shopify: ShoppingBag,
  integrations: Plug,
  "ai-automation": Bot,
  "care-plans": ShieldCheck,
}

type ServiceCardProps = {
  service: Service
  packages: PricingPackage[]
  // "feature" shows the included list too (large bento tile).
  variant?: "default" | "feature"
  className?: string
}

export function ServiceCard({ service, packages, variant = "default", className }: ServiceCardProps) {
  const Icon = serviceIcons[service.slug]
  const feature = variant === "feature"

  return (
    <Link
      href={`/services/${service.slug}`}
      data-spotlight
      className={cn(
        "spotlight gradient-border gradient-border-light group flex flex-col bg-white rounded-3xl p-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <span className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-sm">
          <Icon className="w-5 h-5 text-forest" aria-hidden />
        </span>
        <span className="w-10 h-10 rounded-full border border-sage/30 flex items-center justify-center text-forest transition-[transform,background-color,color] duration-300 group-hover:bg-forest group-hover:text-mint group-hover:rotate-45">
          <ArrowUpRight className="w-4 h-4" aria-hidden />
        </span>
      </div>

      <h3 className={cn("font-heading font-bold text-forest mb-2", feature ? "text-2xl" : "text-xl")}>{service.name}</h3>
      <p className="text-charcoal/80 leading-relaxed mb-6">{feature ? service.problem : service.short}</p>

      {feature && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5 mb-7">
          {service.included.slice(0, 6).map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-charcoal">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-sage-600" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-auto">
        <StartingFrom
          packages={pickPackages(packages, service.packageIds)}
          className="inline-flex text-sm font-semibold text-forest bg-mint/50 border border-sage/20 rounded-full px-3.5 py-1.5"
        />
      </p>
    </Link>
  )
}
