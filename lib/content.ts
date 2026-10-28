import { cache } from "react"
import { ObjectId } from "mongodb"
import type { z } from "zod"
import { getDb, isDbConfigured } from "@/lib/db"
import {
  pricingContentSchema,
  projectsContentSchema,
  type PricingContent,
  type Project,
} from "@/lib/content-schema"
import { defaultPricing } from "@/data/pricing"
import { defaultProjects } from "@/data/projects"

// Admin-editable content lives in one MongoDB document per type. Without
// MONGODB_URI the site uses the defaults in data/. With it set, a database
// error fails the render rather than publishing the defaults by mistake.
// Every save keeps the previous version (last 30 per type) for restoring.

type ContentDoc = { _id: string; data: unknown; updatedAt: Date; updatedBy?: string }
type VersionDoc = { contentId: string; data: unknown; savedAt: Date; savedBy: string }

const MAX_VERSIONS = 30

const contentCollection = async () => (await getDb()).collection<ContentDoc>("content")
const versionCollection = async () => (await getDb()).collection<VersionDoc>("content_versions")

export async function readContent<T>(id: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  if (!isDbConfigured()) return fallback
  const doc = await (await contentCollection()).findOne({ _id: id })
  if (!doc) return fallback
  const parsed = schema.safeParse(doc.data)
  if (!parsed.success) throw new Error(`Stored ${id} content is invalid: ${parsed.error.message}`)
  return parsed.data
}

// Saves new content and keeps what it replaces as a version. On the first
// save, `original` (the built-in defaults) is kept instead, so the website's
// original text can always be restored.
export async function writeContent(id: string, data: unknown, savedBy: string, original?: unknown) {
  const content = await contentCollection()
  const previous = await content.findOne({ _id: id })
  const versions = await versionCollection()
  if (!previous && original !== undefined) {
    await versions.insertOne({ contentId: id, data: original, savedAt: new Date(), savedBy: "Original website content" })
  }
  if (previous) {
    await versions.insertOne({ contentId: id, data: previous.data, savedAt: previous.updatedAt, savedBy: previous.updatedBy ?? "Unknown" })
    const old = await versions.find({ contentId: id }).sort({ savedAt: -1 }).skip(MAX_VERSIONS).project({ _id: 1 }).toArray()
    if (old.length) await versions.deleteMany({ _id: { $in: old.map((v) => v._id) } })
  }
  await content.updateOne({ _id: id }, { $set: { data, updatedAt: new Date(), updatedBy: savedBy } }, { upsert: true })
}

export async function listVersions(id: string) {
  if (!isDbConfigured()) return []
  const docs = await (await versionCollection()).find({ contentId: id }, { projection: { data: 0 } }).sort({ savedAt: -1 }).toArray()
  return docs.map((d) => ({ id: d._id.toString(), savedAt: d.savedAt, savedBy: d.savedBy }))
}

export async function getVersion(versionId: string) {
  if (!ObjectId.isValid(versionId)) return null
  return (await versionCollection()).findOne({ _id: new ObjectId(versionId) })
}

export const getPricing = cache(async (): Promise<PricingContent> => {
  const stored = await readContent("pricing", pricingContentSchema, defaultPricing)
  // Package ids are fixed in code: keep every default package, take saved
  // values where they exist, and ignore ids the code no longer uses.
  const packages = defaultPricing.packages.map((pkg) => stored.packages.find((p) => p.id === pkg.id) ?? pkg)
  return { packages, settings: stored.settings }
})

export const getProjects = cache((): Promise<Project[]> => readContent("projects", projectsContentSchema, defaultProjects))

export async function savePricing(content: PricingContent, savedBy: string) {
  await writeContent("pricing", pricingContentSchema.parse(content), savedBy, defaultPricing)
}

export async function saveProjects(projects: Project[], savedBy: string) {
  await writeContent("projects", projectsContentSchema.parse(projects), savedBy, defaultProjects)
}

export async function getContentUpdatedAt() {
  if (!isDbConfigured()) return {}
  const docs = await (await contentCollection()).find({}, { projection: { updatedAt: 1 } }).toArray()
  return Object.fromEntries(docs.map((doc) => [doc._id, doc.updatedAt])) as Record<string, Date>
}
