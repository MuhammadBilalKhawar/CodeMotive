"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { projectTags, type Project, type ProjectTag } from "@/lib/content-schema"
import { ProjectCard } from "@/components/project-card"

const filters: ("All" | ProjectTag)[] = ["All", ...projectTags]

export function WorkGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<(typeof filters)[number]>("All")
  const shown = active === "All" ? projects : projects.filter((p) => p.services.includes(active))

  return (
    <>
      <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2 mb-10">
        {filters.map((filter) => {
          const count = filter === "All" ? projects.length : projects.filter((p) => p.services.includes(filter)).length
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={active === filter}
              onClick={() => setActive(filter)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors duration-300",
                active === filter
                  ? "bg-forest text-neutral border-forest glow-forest"
                  : "bg-white text-forest border-sage/30 hover:border-forest",
              )}
            >
              {filter}
              <span className={cn("text-xs rounded-full px-1.5", active === filter ? "bg-mint text-forest" : "bg-neutral")}>{count}</span>
            </button>
          )
        })}
      </div>

      {shown.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-lg">
          No projects in this category yet.{" "}
          <Link href="/contact" className="font-semibold text-forest underline underline-offset-4">
            Ask us about similar work
          </Link>
          .
        </p>
      )}
    </>
  )
}
