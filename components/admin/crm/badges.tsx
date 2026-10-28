import { CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { stageLabels, type Stage } from "@/lib/crm/schemas"

const stageTones: Record<Stage, string> = {
  new: "bg-forest text-mint",
  contacted: "bg-mint/70 text-forest",
  quoted: "bg-sage/40 text-forest",
  won: "bg-sage-600 text-white",
  lost: "bg-neutral text-charcoal/80 border border-sage/30",
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", stageTones[stage])}>{stageLabels[stage]}</span>
}

// "YYYY-MM-DD" -> "Today", "Tomorrow", "3 days late" or a date.
export function followUpText(date: string, today: string) {
  const days = Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} late`
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(date))
}

export function FollowUpBadge({ date, today }: { date: string; today: string }) {
  if (!date) return null
  const late = date < today
  const due = date === today
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap",
        late ? "bg-charcoal text-neutral" : due ? "bg-mint text-forest" : "bg-neutral text-charcoal/80",
      )}
      title={`Follow up: ${date}`}
    >
      <CalendarClock className="w-3 h-3" aria-hidden />
      {followUpText(date, today)}
    </span>
  )
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
