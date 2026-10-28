"use client"

import { useRef, useState } from "react"
import dynamic from "next/dynamic"
import { MessageSquareText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/track"

// The panel's code is only downloaded the first time someone opens the chat.
const ChatPanel = dynamic(() => import("@/components/chat/chat-panel").then((m) => m.ChatPanel), { ssr: false })

// Floating "Ask our AI" button on every public page.
export function ChatLauncher({ greeting, suggestions }: { greeting: string; suggestions: string[] }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  const toggle = () => {
    if (!open) trackEvent("chat_open")
    setLoaded(true)
    setOpen((o) => !o)
  }

  const close = () => {
    setOpen(false)
    button.current?.focus()
  }

  return (
    <>
      {loaded && <ChatPanel open={open} onClose={close} greeting={greeting} suggestions={suggestions} />}
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="cm-chat-panel"
        aria-label={open ? "Close chat" : "Ask our AI assistant"}
        className={cn(
          "fixed z-[65] right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] md:right-6 md:bottom-6 h-14 rounded-full flex items-center justify-center gap-2 font-semibold transition-[transform,background-color] duration-300 active:scale-95",
          "bg-mint text-forest border border-forest/10 glow-mint",
          open ? "w-14" : "w-14 md:w-auto md:px-5",
        )}
      >
        {open ? (
          <X className="w-6 h-6" aria-hidden />
        ) : (
          <>
            <MessageSquareText className="w-6 h-6 shrink-0" aria-hidden />
            <span className="hidden md:inline">Ask our AI</span>
          </>
        )}
      </button>
    </>
  )
}
