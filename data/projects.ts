// Default projects. These seed the database and are used as-is when
// MONGODB_URI is not set. Once the database is connected, edit projects in
// /admin/projects instead of here.

import type { Project, ProjectTag } from "@/lib/content-schema"

export type { Project, ProjectTag }

export const defaultProjects: Project[] = [
  {
    slug: "umar-collections",
    title: "Umar Collections",
    type: "Client project",
    status: "live",
    industry: "Fashion retail",
    country: "Pakistan",
    services: ["Ecommerce", "Websites"],
    summary:
      "Online clothing store for a Faisalabad retailer: product catalogue with search and filters, cart and checkout, customer accounts with order history, WhatsApp support and an admin panel for products and orders. Pages are rendered with their own SEO tags and structured data.",
    stack: ["MongoDB", "Express.js", "React", "Node.js", "Vite", "React Router", "GSAP", "Vercel"],
    image: {
      src: "/work/umar-collections.jpg",
      width: 1200,
      height: 630,
      alt: "Umar Collections: clothing, knitwear and bags for everyday wear",
    },
    liveUrl: "https://umarcollections.vercel.app/",
    shareable: true,
  },
  {
    // TODO(Bilal): add the client or business name (if they agree), stack and live URL at launch.
    slug: "label-store-management",
    title: "Label Store & Management System",
    type: "Client project",
    status: "in-development",
    industry: "Printing and labels",
    country: "Pakistan",
    services: ["Ecommerce", "Integrations"],
    summary:
      "An online store for custom labels with a management back office for quotes and orders. In development, launching soon.",
    stack: [],
    liveUrl: "",
    shareable: true,
  },
  {
    // TODO(Bilal): add details and set shareable once the site is live.
    slug: "pharmacy-showcase",
    title: "Pharmacy showcase website",
    type: "Client project",
    status: "in-development",
    industry: "Healthcare",
    country: "Pakistan",
    services: ["Websites"],
    summary: "A showcase website for a pharmacy business.",
    stack: [],
    liveUrl: "",
    shareable: false,
  },
  {
    slug: "ai-recruitment-platform",
    title: "AI Recruitment Platform",
    type: "Demo concept",
    status: "live",
    industry: "Recruitment",
    country: "International",
    services: ["AI"],
    summary: "Parses CVs and ranks candidates against a job description, so recruiters start with a shortlist instead of a pile.",
    stack: ["Python", "OpenAI API", "AWS", "PostgreSQL"],
    image: { src: "/portfolio-1.png", width: 2542, height: 1287, alt: "AI Recruitment Platform dashboard" },
    liveUrl: "https://remote-hire-io.vercel.app/",
    shareable: true,
  },
  {
    slug: "ai-code-review",
    title: "AI Code Review SaaS",
    type: "Demo concept",
    status: "live",
    industry: "Software",
    country: "International",
    services: ["AI"],
    summary: "Reviews pull requests with a large language model and flags likely bugs and security issues before code is merged.",
    stack: ["Next.js", "Node.js", "OpenAI API", "GitHub API"],
    image: { src: "/portfolio-2.png", width: 2557, height: 1283, alt: "AI Code Review SaaS interface" },
    liveUrl: "https://codereviewer-five.vercel.app/",
    shareable: true,
  },
  {
    slug: "ai-interview-evaluation",
    title: "AI Interview Evaluation System",
    type: "Demo concept",
    status: "live",
    industry: "Recruitment",
    country: "International",
    services: ["AI"],
    summary: "Analyses interview transcripts with Google Gemini and produces a structured skills summary for the hiring team.",
    stack: ["Python", "Google Gemini", "React", "PostgreSQL"],
    image: { src: "/portfolio-3.png", width: 2558, height: 1290, alt: "AI Interview Evaluation System report" },
    liveUrl: "https://interview-ai-opal.vercel.app/",
    shareable: true,
  },
]

// Shown publicly: cleared for display, and either live with a URL or marked in development.
// Client work first, in the order saved.
export function visibleProjects(projects: Project[]) {
  return projects
    .filter((p) => p.shareable && (p.status === "in-development" || p.liveUrl !== ""))
    .sort((a, b) => Number(b.type === "Client project") - Number(a.type === "Client project"))
}

export function featuredProjects(projects: Project[]) {
  return visibleProjects(projects).slice(0, 3)
}
