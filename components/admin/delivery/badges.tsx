import { cn } from "@/lib/utils"
import { projectStageLabels, type ProjectStage } from "@/lib/delivery/schemas"

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"

const tones: Record<ProjectStage, string> = {
  planning: "bg-neutral text-charcoal/80 border border-sage/30",
  design: "bg-mint/70 text-forest",
  build: "bg-forest text-mint",
  review: "bg-sage/40 text-forest",
  launched: "bg-sage-600 text-white",
  "on-hold": "bg-charcoal text-neutral",
}

export function ProjectStageBadge({ stage }: { stage: ProjectStage }) {
  return <span className={cn(base, tones[stage])}>{projectStageLabels[stage]}</span>
}

// "3 days left", "Due today", "2 days late" for a deadline.
export function DeadlineBadge({ daysLeft, active }: { daysLeft: number | null; active: boolean }) {
  if (daysLeft === null || !active) return null
  const late = daysLeft < 0
  const soon = daysLeft <= 3
  const text = late ? `${-daysLeft} day${daysLeft === -1 ? "" : "s"} late` : daysLeft === 0 ? "Due today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
  return <span className={cn(base, late ? "bg-charcoal text-neutral" : soon ? "bg-mint text-forest" : "bg-neutral text-charcoal/80")}>{text}</span>
}
