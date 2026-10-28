import { PageHero } from "@/components/page-hero"

type LegalSection = {
  heading: string
  body: React.ReactNode
}

type LegalPageProps = {
  title: string
  intro: string
  updated: string
  sections: LegalSection[]
}

export function LegalPage({ title, intro, updated, sections }: LegalPageProps) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} intro={intro} />
      <section className="theme-light bg-neutral text-charcoal px-4 sm:px-10 md:px-16 lg:px-20 xl:px-[6%] 2xl:px-[8%] py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm text-sage-600 font-medium mb-10">Last updated: {updated}</p>
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-heading font-bold text-xl md:text-2xl text-forest mb-3">{section.heading}</h2>
                <div className="space-y-3 leading-relaxed [&_a]:text-forest [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                  {section.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
