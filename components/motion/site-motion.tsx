"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Scroll animation for the whole site, driven by data attributes in the markup:
//   data-reveal         fade and slide up when scrolled into view
//   data-reveal-group   same, staggered across the element's children
//   data-float          gentle up/down loop (hero chips)
//   data-drift          slow background drift (aurora shapes)
//   data-draw-line      line that draws on scroll ("x" or "y")
//   data-marquee        endless horizontal loop (track holds two copies), pauses on hover/focus
//   data-motion-toggle  button that pauses/plays every loop above (WCAG 2.2.2)
//   data-spotlight      cursor-following glow (mouse devices only, CSS in globals.css)
// The hero entrance (data-hero-item) is plain CSS, see globals.css.
//
// GSAP is imported lazily after the page is interactive, so it never delays
// the first paint. Only transform and opacity are animated, and content is
// never hidden with visibility, so it stays focusable. With reduced motion
// nothing moves and nothing is hidden.
export function SiteMotion() {
  const pathname = usePathname()

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let cancelled = false

    import("@/lib/gsap").then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return
      const mm = gsap.matchMedia()

      mm.add({ motion: "(prefers-reduced-motion: no-preference)", small: "(max-width: 767px)" }, (context) => {
        const { motion, small } = context.conditions as { motion: boolean; small: boolean }
        if (!motion) return

        const distance = small ? 20 : 32
        const duration = small ? 0.6 : 0.8
        const hidden = { opacity: 0, y: distance }
        const shown = { opacity: 1, y: 0, duration, ease: "power3.out" }

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(el, hidden, { ...shown, scrollTrigger: { trigger: el, start: "top 85%", once: true } })
        })

        gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
          gsap.fromTo(group.children, hidden, {
            ...shown,
            stagger: 0.1,
            scrollTrigger: { trigger: group, start: "top 85%", once: true },
          })
        })

        // Endless loops. Each one runs only while on screen and not paused by the
        // visitor (data-motion-toggle) or, for the marquee, by hover/focus.
        const loops: { tween: gsap.core.Tween; holds: Set<string> }[] = []
        const sync = (loop: (typeof loops)[number]) => (loop.holds.size ? loop.tween.pause() : loop.tween.play())
        const hold = (loop: (typeof loops)[number], reason: string, on: boolean) => {
          if (on) loop.holds.add(reason)
          else loop.holds.delete(reason)
          sync(loop)
        }
        const addLoop = (el: HTMLElement, tween: gsap.core.Tween) => {
          const loop = { tween, holds: new Set<string>() }
          loops.push(loop)
          ScrollTrigger.create({ trigger: el, onToggle: (self) => hold(loop, "offscreen", !self.isActive) })
          return loop
        }

        gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el, i) => {
          addLoop(el, gsap.to(el, { y: small ? -6 : -10, duration: 2.6 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 }))
        })

        gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el, i) => {
          const dir = i % 2 ? -1 : 1
          addLoop(el, gsap.to(el, { xPercent: 12 * dir, yPercent: -10 * dir, duration: 14 + i * 3, ease: "sine.inOut", yoyo: true, repeat: -1 }))
        })

        gsap.utils.toArray<HTMLElement>("[data-draw-line]").forEach((el) => {
          const prop = el.dataset.drawLine === "y" ? "scaleY" : "scaleX"
          gsap.fromTo(
            el,
            { [prop]: 0 },
            { [prop]: 1, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top 75%", end: "bottom 65%", scrub: true } },
          )
        })

        const listeners: (() => void)[] = []
        const listen = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
          el.addEventListener(type, fn)
          listeners.push(() => el.removeEventListener(type, fn))
        }

        gsap.utils.toArray<HTMLElement>("[data-marquee]").forEach((track) => {
          const loop = addLoop(track, gsap.to(track, { xPercent: -50, duration: small ? 30 : 45, ease: "none", repeat: -1 }))
          const area = track.parentElement ?? track
          listen(area, "pointerenter", () => hold(loop, "hover", true))
          listen(area, "pointerleave", () => hold(loop, "hover", false))
          listen(area, "focusin", () => hold(loop, "focus", true))
          listen(area, "focusout", () => hold(loop, "focus", false))
        })

        gsap.utils.toArray<HTMLButtonElement>("[data-motion-toggle]").forEach((button) => {
          listen(button, "click", () => {
            const paused = button.dataset.paused !== "true"
            document.querySelectorAll("[data-motion-toggle]").forEach((b) => b.setAttribute("data-paused", String(paused)))
            loops.forEach((loop) => hold(loop, "user", paused))
          })
        })

        return () => listeners.forEach((off) => off())
      })

      // Positions shift once web fonts and images settle.
      const refresh = () => ScrollTrigger.refresh()
      document.fonts?.ready.then(refresh)
      if (document.readyState !== "complete") window.addEventListener("load", refresh, { once: true })

      cleanup = () => {
        window.removeEventListener("load", refresh)
        mm.revert()
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [pathname])

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-spotlight]")
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`)
      el.style.setProperty("--my", `${e.clientY - rect.top}px`)
    }
    document.addEventListener("pointermove", onMove, { passive: true })
    return () => document.removeEventListener("pointermove", onMove)
  }, [])

  return null
}
