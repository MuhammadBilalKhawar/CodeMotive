import { notFound } from "next/navigation"
import { isDbConfigured } from "@/lib/db"
import { listVersions } from "@/lib/content"
import { isContentKey } from "@/lib/content-registry"
import { getEditableContent } from "@/lib/cms"
import { editorSpecs } from "@/lib/cms/fields"
import { posts } from "@/data/blog"
import { ContentEditor } from "@/components/admin/content-editor"
import { VersionHistory } from "@/components/admin/version-history"
import { dateTimeFormat } from "@/components/admin/ui"

type Props = { params: Promise<{ key: string }> }

export async function generateMetadata({ params }: Props) {
  const { key } = await params
  return { title: isContentKey(key) ? editorSpecs[key].title : "Website" }
}

// One editor page per website content type (site settings, homepage, ...).
export default async function WebsiteContentPage({ params }: Props) {
  const { key } = await params
  if (!isContentKey(key)) notFound()
  const spec = editorSpecs[key]
  const [initial, versions] = await Promise.all([getEditableContent(key), listVersions(key)])
  const titles = key === "guides" ? Object.fromEntries(posts.map((p) => [p.slug, p.title])) : undefined

  return (
    <>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-forest">{spec.title}</h1>
        <p className="text-charcoal/80 mt-1">{spec.intro} Changes go live as soon as you save.</p>
        {!isDbConfigured() && (
          <p role="alert" className="mt-4 rounded-xl bg-mint/40 border border-sage/40 px-4 py-3 text-sm text-forest">
            The database isn&apos;t connected, so changes can&apos;t be saved yet. Add MONGODB_URI to the environment variables.
          </p>
        )}
      </div>
      <ContentEditor contentKey={key} initial={initial} canSave={isDbConfigured()} titles={titles} />
      <div className="mt-8">
        <VersionHistory contentKey={key} versions={versions.map((v) => ({ id: v.id, savedAt: dateTimeFormat.format(v.savedAt), savedBy: v.savedBy }))} />
      </div>
    </>
  )
}
