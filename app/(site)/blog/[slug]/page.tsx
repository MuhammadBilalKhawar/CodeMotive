import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Clock, PencilLine } from "lucide-react"
import { posts } from "@/data/blog"
import { getPost, getServices } from "@/lib/cms"
import { getPricing } from "@/lib/content"
import { articleJsonLd, blogAuthor, pageMetadata } from "@/lib/seo"
import { PageHero } from "@/components/page-hero"
import { Section, SectionHeading } from "@/components/section"
import { ServiceCard } from "@/components/service-card"
import { CtaBand } from "@/components/cta-band"
import { JsonLd } from "@/components/json-ld"

type Props = { params: Promise<{ slug: string }> }

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" })

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug)
  if (!post) return {}
  return pageMetadata({ title: post.title, description: post.description, path: `/blog/${post.slug}`, type: "article", noIndex: !post.published })
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost((await params).slug)
  if (!post) notFound()

  const [pricing, services] = await Promise.all([getPricing(), getServices()])
  const path = `/blog/${post.slug}`
  const related = post.serviceSlugs.map((slug) => services.find((s) => s.slug === slug)).filter((s) => s !== undefined)
  const Content = post.Content

  return (
    <>
      {post.published && (
        <JsonLd data={articleJsonLd({ title: post.title, description: post.description, path, published: post.datePublished, updated: post.dateUpdated })} />
      )}
      <PageHero
        eyebrow="Guide"
        title={post.title}
        breadcrumbs={[
          { name: "Guides", path: "/blog" },
          { name: post.title, path },
        ]}
      >
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mint/85">
          <span>
            By <span className="font-semibold text-white">{blogAuthor.name}</span>
          </span>
          <span>
            Updated <time dateTime={post.dateUpdated}>{dateFormat.format(new Date(post.dateUpdated))}</time>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-4 h-4" aria-hidden />
            {post.readingMinutes} min read
          </span>
        </p>
      </PageHero>

      <Section>
        {!post.published && (
          <p role="note" className="mb-8 max-w-3xl flex items-start gap-3 rounded-2xl border border-sage/40 bg-mint/40 p-4 text-sm text-forest">
            <PencilLine className="w-5 h-5 shrink-0" aria-hidden />
            <span>
              Draft for review: this guide isn&apos;t listed or indexed yet. Set <code>published: true</code> in its file under{" "}
              <code>data/blog/</code> to publish it.
            </span>
          </p>
        )}
        <article className="prose-cm max-w-3xl">
          <Content pricing={pricing} />
        </article>

        <aside className="mt-14 max-w-3xl gradient-border gradient-border-light rounded-3xl bg-white p-6 sm:p-7 flex gap-5 items-start">
          <span aria-hidden className="w-14 h-14 shrink-0 rounded-full p-[3px] bg-brand-gradient">
            <span className="w-full h-full rounded-full bg-forest text-mint font-heading font-bold flex items-center justify-center">{blogAuthor.initials}</span>
          </span>
          <div>
            <p className="font-heading font-bold text-forest">{blogAuthor.name}</p>
            <p className="text-sm font-semibold text-sage-600 mb-2">{blogAuthor.role}</p>
            <p className="text-sm text-charcoal/85 leading-relaxed">{blogAuthor.bio}</p>
          </div>
        </aside>
      </Section>

      {related.length > 0 && (
        <Section tone="white">
          <SectionHeading eyebrow="Related services" title="Ready to" accent="get started?" />
          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((service) => (
              <ServiceCard key={service.slug} service={service} packages={pricing.packages} />
            ))}
          </div>
        </Section>
      )}

      <CtaBand />
    </>
  )
}
