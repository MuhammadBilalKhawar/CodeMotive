"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AlertCircle, ArrowRight, MessageCircle, SendHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSiteContact } from "@/components/site-contact"
import { useVisitor } from "@/components/visitor-provider"
import { trackEvent } from "@/lib/track"

// `greeting` marks the local welcome message, which isn't sent to the server.
type Message = { role: "user" | "assistant"; content: string; greeting?: true }

const STORAGE_KEY = "cm-chat"
const MAX_LENGTH = 600

// Turns URLs and "/contact" in a reply into links.
function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s)]+|\/contact\b)/g).map((part, i) => {
    if (part === "/contact") {
      return (
        <Link key={i} href="/contact" className="font-semibold underline underline-offset-2">
          code-motive.dev/contact
        </Link>
      )
    }
    if (/^https?:\/\//.test(part)) {
      const href = part.replace(/[.,]+$/, "")
      return (
        <Fragment key={i}>
          <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 break-all">
            {href.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
          {part.slice(href.length)}
        </Fragment>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function loadHistory(greeting: string): Message[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]")
    if (Array.isArray(saved) && saved.length) return saved
  } catch {}
  return [{ role: "assistant", content: greeting, greeting: true }]
}

type ChatPanelProps = { open: boolean; onClose: () => void; greeting: string; suggestions: string[] }

export function ChatPanel({ open, onClose, greeting, suggestions }: ChatPanelProps) {
  const { currency } = useVisitor()
  const { whatsappUrl } = useSiteContact()
  const [messages, setMessages] = useState<Message[]>(() => loadHistory(greeting))
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // Keep the conversation for this tab (survives page changes and reloads).
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
    } catch {}
  }, [messages])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, sending])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const send = async (text: string) => {
    const content = text.trim().slice(0, MAX_LENGTH)
    if (!content || sending) return
    const next: Message[] = [...messages, { role: "user", content }]
    setMessages(next)
    setInput("")
    setError(null)
    setSending(true)
    if (!messages.some((m) => m.role === "user")) trackEvent("chat_message")

    try {
      // The greeting is local, so only real turns go to the server.
      const conversation = next.filter((m) => !m.greeting).map(({ role, content }) => ({ role, content }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation.slice(-20), currency }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reply?: string; error?: string }
      if (res.ok && data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply! }])
      } else {
        setError(data.error ?? "Something went wrong. Please try again, or message us on WhatsApp.")
      }
    } catch {
      setError("Couldn't reach the assistant. Check your connection and try again.")
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const started = messages.some((m) => m.role === "user")

  return (
    <section
      id="cm-chat-panel"
      aria-label="Chat with CodeMotive's AI assistant"
      hidden={!open}
      className={cn(
        "fixed z-[66] inset-x-3 bottom-[5.25rem] top-[max(5rem,env(safe-area-inset-top))] md:inset-x-auto md:top-auto md:right-6 md:bottom-24 md:w-[400px] md:h-[min(620px,calc(100vh-8rem))]",
        "flex flex-col rounded-3xl overflow-hidden bg-neutral text-charcoal theme-light shadow-2xl border border-sage/30",
        open && "animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none",
      )}
    >
      <header className="relative bg-forest text-neutral px-5 py-4 flex items-center gap-3 theme-dark">
        <span className="w-10 h-10 shrink-0 rounded-full bg-forest-800 border border-mint/20 flex items-center justify-center">
          <Image src="/brand/header-icon-dark-mode.svg" alt="" width={28} height={16} className="w-6 h-auto" />
        </span>
        <div className="min-w-0">
          <p className="font-heading font-semibold text-white">CodeMotive assistant</p>
          <p className="text-xs text-mint/85 flex items-center gap-1.5">
            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-mint" aria-hidden />
            AI · answers from our prices and services
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close chat" className="ml-auto w-9 h-9 rounded-full flex items-center justify-center text-mint hover:bg-forest-800">
          <X className="w-5 h-5" aria-hidden />
        </button>
      </header>

      <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed whitespace-pre-line",
                m.role === "user" ? "bg-forest text-neutral rounded-br-sm" : "bg-white border border-sage/20 rounded-bl-sm",
              )}
            >
              <span className="sr-only">{m.role === "user" ? "You: " : "Assistant: "}</span>
              {m.role === "assistant" ? linkify(m.content) : m.content}
            </p>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start" aria-label="Assistant is typing">
            <span className="rounded-2xl rounded-bl-sm bg-white border border-sage/20 px-4 py-3.5 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot w-2 h-2 rounded-full bg-sage-600" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </span>
          </div>
        )}

        {!started && !sending && (
          <ul className="flex flex-wrap gap-2 pt-1" aria-label="Suggested questions">
            {suggestions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-sage/40 bg-white px-3.5 py-1.5 text-sm font-medium text-forest hover:border-forest"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="flex items-start gap-1.5 text-sm font-medium text-danger">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-sage/20 bg-white px-3 pt-3 pb-3 space-y-2.5">
        {started && (
          <div className="flex gap-2">
            <Link href="/contact" onClick={onClose} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-neutral">
              Get a free quote
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-sage/50 px-3 py-2 text-sm font-semibold text-forest"
            >
              <MessageCircle className="w-4 h-4" aria-hidden />
              WhatsApp
            </a>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="cm-chat-input" className="sr-only">
            Your message
          </label>
          <textarea
            id="cm-chat-input"
            ref={inputRef}
            rows={1}
            maxLength={MAX_LENGTH}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your question…"
            className="flex-1 resize-none max-h-32 rounded-xl border border-sage/40 bg-neutral/60 px-3.5 py-2.5 text-[0.95rem] focus:border-forest focus:outline-none field-sizing-content"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="w-11 h-11 shrink-0 rounded-xl bg-forest text-mint flex items-center justify-center disabled:opacity-40"
          >
            <SendHorizontal className="w-5 h-5" aria-hidden />
          </button>
        </form>
        <p className="text-xs leading-snug text-charcoal/70 px-1">
          AI answers can be wrong; Bilal confirms every quote personally. Chats aren&apos;t stored.{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>
        </p>
      </div>
    </section>
  )
}
