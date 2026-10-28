import { cn } from "@/lib/utils"

// Small building blocks shared by every admin page.

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="font-heading font-bold text-3xl text-forest">{title}</h1>
        {description && <p className="text-charcoal/80 mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, description, children, className }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-sage/25 bg-white p-5 sm:p-6", className)}>
      {title && <h2 className="font-heading font-bold text-lg text-forest">{title}</h2>}
      {description && <p className="text-sm text-charcoal/80 mt-0.5 mb-4">{description}</p>}
      {title && !description && <div className="mb-4" />}
      {children}
    </section>
  )
}

export const buttonClass = {
  primary: "inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-neutral hover:bg-forest-700 disabled:opacity-50",
  secondary: "inline-flex items-center justify-center gap-2 rounded-lg border border-sage/40 bg-white px-4 py-2 text-sm font-semibold text-forest hover:border-forest disabled:opacity-50",
  quiet: "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-forest hover:bg-neutral disabled:opacity-50",
  danger: "inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal/30 bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-neutral disabled:opacity-50",
}

const badgeTones = {
  neutral: "bg-neutral text-charcoal",
  mint: "bg-mint/60 text-forest",
  forest: "bg-forest text-mint",
  warn: "bg-charcoal text-neutral",
}

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTones; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", badgeTones[tone])}>{children}</span>
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-sage/40 p-10 text-center text-charcoal/80">{children}</div>
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        tone === "error" ? "bg-charcoal text-neutral" : tone === "success" ? "bg-mint/60 text-forest" : "bg-mint/30 text-forest border border-sage/30",
      )}
    >
      {children}
    </p>
  )
}

export const dateTimeFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" })
export const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Karachi" })
