import Image from "next/image"
import { Linkedin } from "lucide-react"
import type { TeamContent } from "@/lib/cms/schemas"

// Shows the uploaded photo, or a monogram avatar when there's none.
export function FounderCard({ founder }: { founder: TeamContent[number] }) {
  return (
    <article
      data-spotlight
      className="spotlight gradient-border gradient-border-light bg-white rounded-3xl p-7 sm:p-9 flex flex-col"
    >
      <div className="flex items-center gap-5 mb-7">
        <div aria-hidden className="relative w-20 h-20 shrink-0 rounded-full p-[3px] bg-brand-gradient">
          {founder.photo ? (
            <Image src={founder.photo} alt="" width={160} height={160} className="w-full h-full rounded-full object-cover bg-forest" />
          ) : (
            <div className="w-full h-full rounded-full bg-forest text-mint font-heading font-bold text-2xl flex items-center justify-center tracking-wider">
              {founder.initials}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-heading font-bold text-2xl text-forest">{founder.name}</h3>
          <p className="text-sm font-semibold text-sage-600">{founder.role}</p>
          <p className="text-sm text-charcoal/80">{founder.experience}</p>
        </div>
      </div>

      <p className="text-charcoal leading-relaxed mb-7">{founder.bio}</p>

      <h4 className="eyebrow text-sage-600 mb-3">Handles for clients</h4>
      <ul className="space-y-2.5 mb-7">
        {founder.handles.map((item) => (
          <li key={item} className="text-sm text-charcoal flex gap-2.5">
            <span aria-hidden className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-gradient shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      <ul className="flex flex-wrap gap-2 mt-auto" aria-label="Skills">
        {founder.skills.map((skill) => (
          <li key={skill} className="text-xs font-semibold text-forest bg-mint/40 border border-sage/20 rounded-full px-3 py-1.5">
            {skill}
          </li>
        ))}
      </ul>

      {founder.linkedinUrl && (
        <a
          href={founder.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-sage-600 w-fit"
        >
          <Linkedin className="w-4 h-4" aria-hidden />
          {founder.name} on LinkedIn
        </a>
      )}
    </article>
  )
}
