import { HeartPulse, Scissors, ShoppingBag, UtensilsCrossed, Wrench } from "lucide-react"
import type { Industry } from "@/data/industries"

export const industryIcons: Record<Industry["icon"], typeof Wrench> = {
  restaurant: UtensilsCrossed,
  salon: Scissors,
  clinic: HeartPulse,
  retail: ShoppingBag,
  home: Wrench,
}
