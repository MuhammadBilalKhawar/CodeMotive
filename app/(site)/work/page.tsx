import { visibleProjects } from "@/data/projects"
import { getProjects } from "@/lib/content"
import { PageHero } from "@/components/page-hero"
import { Section } from "@/components/section"
import { WorkGrid } from "@/components/work-grid"
import { CtaBand } from "@/components/cta-band"
import { seoMetadata } from "@/lib/cms"

export const generateMetadata = () => seoMetadata("/work")

export default async function WorkPage() {
  const projects = visibleProjects(await getProjects())

  return (
    <>
      <PageHero
        eyebrow="Our work"
        title="Projects we've built"
        intro="Every project is labelled: a client project was built for a real business, a demo concept shows what we can build for your industry."
      />
      <Section>
        <WorkGrid projects={projects} />
      </Section>
      <CtaBand title="Want something like this?" text="Tell us about your business and we'll send a fixed quote." />
    </>
  )
}
