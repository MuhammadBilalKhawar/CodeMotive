import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { getPublishedPosts, seoMetadata } from "@/lib/cms"
import { PageHero } from "@/components/page-hero"
import { Section } from "@/components/section"
import { CtaBand } from "@/components/cta-band"

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" })

export async function generateMetadata() {
  // Stay out of search until at least one guide is published.
  return seoMetadata("/blog", { noIndex: (await getPublishedPosts()).length === 0 })
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts()

  return (
    <>
      <PageHero
        eyebrow="Guides"
        title="Straight answers for small business owners"
        intro="What websites and online stores cost, how long they take, and how to choose. Written by the people who build them."
        breadcrumbs={[{ name: "Guides", path: "/blog" }]}
      />
      <Section>
        {posts.length === 0 ? (
          <p className="text-lg">New guides are on their way. In the meantime, see our <Link href="/pricing" className="font-semibold text-forest underline underline-offset-4">pricing</Link> or <Link href="/contact" className="font-semibold text-forest underline underline-offset-4">ask us directly</Link>.</p>
        ) : (
          <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                data-spotlight
                className="spotlight gradient-border gradient-border-light group flex flex-col rounded-3xl bg-white p-7 transition-transform duration-300 hover:-translate-y-1"
              >
                <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-sage-600 mb-3">
                  <time dateTime={post.dateUpdated}>{dateFormat.format(new Date(post.dateUpdated))}</time>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden />
                    {post.readingMinutes} min read
                  </span>
                </p>
                <h2 className="font-heading font-bold text-xl text-forest mb-3">{post.title}</h2>
                <p className="text-charcoal/85 leading-relaxed mb-6">{post.description}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
                  Read the guide
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>
      <CtaBand />
    </>
  )
}
