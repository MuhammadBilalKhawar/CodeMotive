import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo"

// Search engines and AI assistants are welcome everywhere public. Listed AI
// crawlers get explicit rules so it's clear they're allowed (plan section 8b).
const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Bingbot",
  "Applebot-Extended",
]

// Project screenshots are served from /api/images, so that path stays open.
// Client quote and invoice links are private (also noindex on the pages).
const rule = { allow: ["/", "/api/images/"], disallow: ["/admin", "/api/", "/quote/", "/invoice/"] }

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", ...rule }, ...aiCrawlers.map((userAgent) => ({ userAgent, ...rule }))],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  }
}
