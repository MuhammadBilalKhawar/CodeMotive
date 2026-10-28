"use client"

import { Printer } from "lucide-react"
import { buttonClass } from "@/components/admin/ui"

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass.primary}>
      <Printer className="w-4 h-4" aria-hidden />
      Print or save as PDF
    </button>
  )
}
