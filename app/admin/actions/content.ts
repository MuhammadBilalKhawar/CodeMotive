"use server"

import { revalidatePath } from "next/cache"
import type { z } from "zod"
import { isDbConfigured } from "@/lib/db"
import { getVersion, savePricing, saveProjects, writeContent } from "@/lib/content"
import { pricingContentSchema, projectsContentSchema, type PricingContent, type Project } from "@/lib/content-schema"
import { isActionError, userForAction } from "@/lib/auth/current"
import { logActivity } from "@/lib/audit"
import { contentRegistry, isContentKey, type ContentKey } from "@/lib/content-registry"
import { editorSpecs, fieldPathLabel } from "@/lib/cms/fields"
import type { ActionResult, SaveResult } from "@/app/admin/actions/types"

// Up to five problems, each named the way the editor labels the field when
// `label` is given (website content), otherwise by its raw path.
function describeIssues(error: z.ZodError, label?: (path: (string | number)[]) => string) {
  return error.issues
    .slice(0, 5)
    .map((issue) => `${label?.(issue.path) || issue.path.join(" › ") || "Content"}: ${issue.message}`)
    .join("\n")
}

// Rebuild every public page, the sitemap and llms.txt on their next visit.
function revalidateSite() {
  revalidatePath("/", "layout")
  revalidatePath("/sitemap.xml")
  revalidatePath("/llms.txt")
}

async function saveWith<T>(
  label: string,
  entity: string,
  schema: z.ZodType<T>,
  input: unknown,
  save: (data: T, savedBy: string) => Promise<void>,
  fieldLabel?: (path: (string | number)[]) => string,
): Promise<SaveResult> {
  const user = await userForAction()
  if (isActionError(user)) return user
  if (!isDbConfigured()) return { ok: false, error: "The database isn't connected. Add MONGODB_URI to the environment variables." }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describeIssues(parsed.error, fieldLabel) }

  try {
    await save(parsed.data, user.name)
  } catch (error) {
    console.error(`Admin save failed (${entity})`, error)
    return { ok: false, error: "Couldn't save to the database. Please try again." }
  }

  await logActivity(user, { action: "saved", entity, summary: `${user.name} updated ${label}` })
  revalidateSite()
  return { ok: true, savedAt: new Date().toISOString() }
}

export async function savePricingAction(content: PricingContent) {
  return saveWith("pricing", "pricing", pricingContentSchema, content, savePricing)
}

export async function saveProjectsAction(projects: Project[]) {
  return saveWith("the portfolio", "projects", projectsContentSchema, projects, saveProjects)
}

// Website content managed through the content registry (site settings, pages, ...).
export async function saveContentAction(key: ContentKey, data: unknown) {
  if (!isContentKey(key)) return { ok: false as const, error: "Unknown content." }
  const entry = contentRegistry[key]
  return saveWith(
    entry.label,
    key,
    entry.schema as z.ZodType<unknown>,
    data,
    (value, savedBy) => writeContent(key, value, savedBy, entry.defaults),
    (path) => fieldPathLabel(editorSpecs[key].field, data, path),
  )
}

// Puts an earlier version back (the current one is kept as a version too).
export async function restoreVersionAction(key: string, versionId: string): Promise<ActionResult> {
  const user = await userForAction()
  if (isActionError(user)) return user
  const version = await getVersion(versionId)
  if (!version || version.contentId !== key) return { ok: false, error: "That version doesn't exist." }

  const schema = key === "pricing" ? pricingContentSchema : key === "projects" ? projectsContentSchema : contentRegistry[key as ContentKey]?.schema
  if (!schema || !schema.safeParse(version.data).success) return { ok: false, error: "That version can't be restored (its format is out of date)." }

  await writeContent(key, version.data, user.name)
  await logActivity(user, { action: "restored version", entity: key, entityId: versionId, summary: `${user.name} restored ${key} to the version from ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(version.savedAt)}` })
  revalidateSite()
  revalidatePath("/admin", "layout")
  return { ok: true }
}
