"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type Tone = "light" | "dark"

function Avatar() {
  return (
    <span className="w-10 h-10 shrink-0 rounded-full bg-forest border border-mint/20 flex items-center justify-center">
      <Image src="/brand/header-icon-dark-mode.svg" alt="" width={28} height={16} className="w-6 h-auto" />
    </span>
  )
}

// Chat-style card showing the instant reply after a form is sent.
export function ReplyCard({ title, reply, footer, tone = "light" }: { title: string; reply: string; footer?: React.ReactNode; tone?: Tone }) {
  const dark = tone === "dark"
  const card = useRef<HTMLDivElement>(null)

  // The form above it disappears, so bring the reply into view (on phones it
  // would otherwise be off-screen) and move focus to it for screen readers.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    card.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" })
    card.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div
      ref={card}
      tabIndex={-1}
      role="status"
      className={cn(
        "rounded-3xl p-6 sm:p-9 scroll-mt-24 focus:outline-none animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none",
        dark ? "glass gradient-border text-neutral" : "gradient-border gradient-border-light bg-white text-charcoal shadow-lift",
      )}
    >
      <h3 className={cn("font-heading font-bold text-2xl mb-6", dark ? "text-white" : "text-forest")}>{title}</h3>
      <div className="flex gap-3 items-start">
        <Avatar />
        <div className="min-w-0">
          <p className={cn("text-xs font-semibold mb-1.5", dark ? "text-mint" : "text-sage-600")}>CodeMotive</p>
          <div
            className={cn(
              "rounded-2xl rounded-tl-sm px-5 py-4 leading-relaxed whitespace-pre-line",
              dark ? "bg-forest/80 border border-mint/10 text-neutral" : "bg-neutral border border-sage/20 text-charcoal",
            )}
          >
            {reply}
          </div>
        </div>
      </div>
      {footer && <div className={cn("mt-6 text-sm", dark ? "text-mint" : "text-charcoal/85")}>{footer}</div>}
    </div>
  )
}

// "Typing…" bubble while the reply is being written.
export function TypingBubble({ tone = "light" }: { tone?: Tone }) {
  const dark = tone === "dark"
  return (
    <div className="flex gap-3 items-center" role="status" aria-label="Writing a reply">
      <Avatar />
      <div className={cn("rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5", dark ? "bg-forest/80 border border-mint/10" : "bg-neutral border border-sage/20")}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("typing-dot w-2 h-2 rounded-full", dark ? "bg-mint" : "bg-sage-600")}
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
