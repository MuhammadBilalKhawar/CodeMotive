import Image from "next/image"
import { ArrowUpRight, Hammer } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project } from "@/data/projects"

export function ProjectCard({ project }: { project: Project }) {
  const isClient = project.type === "Client project"
  const inDevelopment = project.status === "in-development"

  return (
    <article
      data-spotlight
      className="spotlight gradient-border gradient-border-light group flex flex-col bg-white rounded-3xl overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[1200/630] bg-forest overflow-hidden">
        {project.image ? (
          <Image
            src={project.image.src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-mint">
            <div aria-hidden className="absolute inset-0 bg-grid" />
            <div aria-hidden className="aurora w-72 h-72 -top-24 -right-16" />
            <Hammer className="relative w-8 h-8" aria-hidden />
            <p className="relative font-heading font-semibold text-sm tracking-wide">Launching soon</p>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span
            className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full backdrop-blur",
              isClient ? "bg-forest/90 text-mint" : "bg-mint/95 text-forest",
            )}
          >
            {project.type}
          </span>
          {inDevelopment && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-neutral/95 text-forest">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-sage-600" aria-hidden />
              In development
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">
          {project.industry} · {project.country}
        </p>
        <h3 className="font-heading font-bold text-xl text-forest mb-3">{project.title}</h3>
        <p className="text-sm text-charcoal/85 leading-relaxed mb-5">{project.summary}</p>
        {project.result && <p className="text-sm font-semibold text-forest mb-5">{project.result}</p>}
        {project.stack.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mb-6" aria-label="Built with">
            {project.stack.map((tech) => (
              <li key={tech} className="text-xs font-medium text-forest bg-neutral border border-sage/20 rounded-full px-2.5 py-1">
                {tech}
              </li>
            ))}
          </ul>
        )}
        {project.liveUrl && !inDevelopment ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-sage-600 w-fit"
          >
            View live site<span className="sr-only">: {project.title}</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </a>
        ) : (
          <p className="mt-auto text-sm font-semibold text-sage-600">Live link coming at launch</p>
        )}
      </div>
    </article>
  )
}
