"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { ArrowDown, ArrowUp, EyeOff, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { projectTags, projectsContentSchema, type Project } from "@/lib/content-schema"
import { saveProjectsAction } from "@/app/admin/actions/content"
import type { SaveResult } from "@/app/admin/actions/types"
import { Field, SaveBar, inputClass } from "@/components/admin/fields"
import { uploadImage } from "@/lib/admin/upload-image"

// Form state: the stack is edited as comma-separated text, and each row has a
// stable key because the slug itself can change.
type ProjectForm = Omit<Project, "stack" | "result"> & { key: string; stack: string; result: string; slugTouched: boolean }

let keySeed = 0
const newKey = () => `p${Date.now()}-${keySeed++}`

const toForm = (project: Project): ProjectForm => ({
  ...project,
  key: newKey(),
  stack: project.stack.join(", "),
  result: project.result ?? "",
  slugTouched: true,
})

const fromForm = ({ key: _key, slugTouched: _touched, stack, result, ...project }: ProjectForm): Project => ({
  ...project,
  stack: stack
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  ...(result.trim() && { result: result.trim() }),
})

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

// Snapshot used to detect unsaved changes; always built the same way so key
// order can't make identical content look different.
const snapshot = (list: ProjectForm[]) => JSON.stringify(list.map(fromForm))

const isShown = (p: ProjectForm) => p.shareable && (p.status === "in-development" || p.liveUrl !== "")

const blankProject = (): ProjectForm => ({
  key: newKey(),
  slug: "",
  slugTouched: false,
  title: "",
  type: "Client project",
  status: "live",
  industry: "",
  country: "Pakistan",
  services: ["Websites"],
  summary: "",
  result: "",
  stack: "",
  liveUrl: "",
  shareable: true,
})

export function ProjectsEditor({ initial, canSave }: { initial: Project[]; canSave: boolean }) {
  const [projects, setProjects] = useState(() => initial.map(toForm))
  const [selectedKey, setSelectedKey] = useState<string | null>(() => projects[0]?.key ?? null)
  const [saved, setSaved] = useState(() => snapshot(projects))
  const [result, setResult] = useState<SaveResult | null>(null)
  const [saving, startSaving] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const current = projects.find((p) => p.key === selectedKey) ?? null
  const dirty = useMemo(() => snapshot(projects) !== saved, [projects, saved])

  const update = (patch: Partial<ProjectForm>) =>
    setProjects((list) =>
      list.map((p) => {
        if (p.key !== selectedKey) return p
        const next = { ...p, ...patch }
        // New projects get a slug from the title until the slug is edited by hand.
        if (patch.title !== undefined && !p.slugTouched) next.slug = slugify(patch.title)
        return next
      }),
    )

  const move = (key: string, by: -1 | 1) =>
    setProjects((list) => {
      const i = list.findIndex((p) => p.key === key)
      const j = i + by
      if (j < 0 || j >= list.length) return list
      const copy = [...list]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })

  const remove = (key: string) => {
    const project = projects.find((p) => p.key === key)
    if (!window.confirm(`Delete "${project?.title || "this project"}"? This takes effect when you save.`)) return
    setProjects((list) => list.filter((p) => p.key !== key))
    if (selectedKey === key) setSelectedKey(projects.find((p) => p.key !== key)?.key ?? null)
  }

  const add = () => {
    const project = blankProject()
    setProjects((list) => [project, ...list])
    setSelectedKey(project.key)
  }

  const upload = async (file: File) => {
    setUploadError(null)
    setUploading(true)
    try {
      const { src, width, height } = await uploadImage(file)
      update({ image: { src, width, height, alt: current?.image?.alt || current?.title || "Project screenshot" } })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const save = () => {
    const payload = projects.map(fromForm)
    const parsed = projectsContentSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues.slice(0, 5).map((issue) => {
        const [index, field] = issue.path
        const title = typeof index === "number" ? payload[index]?.title || `Project ${index + 1}` : "Projects"
        return `${title}${field ? ` › ${String(field)}` : ""}: ${issue.message}`
      })
      setResult({ ok: false, error: issues.join("\n") })
      return
    }
    const savedSnapshot = snapshot(projects)
    startSaving(async () => {
      const outcome = await saveProjectsAction(parsed.data)
      setResult(outcome)
      if (outcome.ok) setSaved(savedSnapshot)
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-24 space-y-3">
          <button
            type="button"
            onClick={add}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sage/50 px-4 py-3 text-sm font-semibold text-forest hover:border-forest hover:bg-white"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Add project
          </button>
          <ul className="space-y-2" aria-label="Projects">
            {projects.map((p, index) => (
              <li key={p.key}>
                <div
                  className={cn(
                    "rounded-xl border bg-white p-3 transition-colors",
                    p.key === selectedKey ? "border-forest ring-1 ring-forest" : "border-sage/25 hover:border-sage",
                  )}
                >
                  <button type="button" onClick={() => setSelectedKey(p.key)} className="w-full text-left" aria-current={p.key === selectedKey}>
                    <span className="block font-semibold text-forest truncate">{p.title || "Untitled project"}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5 text-[0.7rem] font-semibold">
                      <span className="rounded-full bg-neutral px-2 py-0.5 text-forest">{p.type}</span>
                      {p.status === "in-development" && <span className="rounded-full bg-mint/60 px-2 py-0.5 text-forest">In development</span>}
                      {!isShown(p) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-charcoal/10 px-2 py-0.5 text-charcoal">
                          <EyeOff className="w-3 h-3" aria-hidden />
                          Hidden
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="mt-2 flex gap-1 justify-end">
                    <button type="button" onClick={() => move(p.key, -1)} disabled={index === 0} aria-label={`Move ${p.title || "project"} up`} className="p-1.5 rounded-md text-forest hover:bg-neutral disabled:opacity-30">
                      <ArrowUp className="w-4 h-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => move(p.key, 1)} disabled={index === projects.length - 1} aria-label={`Move ${p.title || "project"} down`} className="p-1.5 rounded-md text-forest hover:bg-neutral disabled:opacity-30">
                      <ArrowDown className="w-4 h-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => remove(p.key)} aria-label={`Delete ${p.title || "project"}`} className="p-1.5 rounded-md text-charcoal hover:bg-neutral">
                      <Trash2 className="w-4 h-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-charcoal/70">The order here is the order on the website. Client projects are always listed before demos.</p>
        </div>

        {current ? (
          <div className="rounded-2xl border border-sage/25 bg-white p-5 sm:p-7 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title">
                <input className={inputClass} value={current.title} onChange={(e) => update({ title: e.target.value })} />
              </Field>
              <Field label="URL slug" hint="Lowercase letters, numbers and dashes">
                <input className={inputClass} value={current.slug} onChange={(e) => update({ slug: e.target.value, slugTouched: true })} />
              </Field>
              <Field label="Type">
                <select className={inputClass} value={current.type} onChange={(e) => update({ type: e.target.value as ProjectForm["type"] })}>
                  <option>Client project</option>
                  <option>Demo concept</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} value={current.status} onChange={(e) => update({ status: e.target.value as ProjectForm["status"] })}>
                  <option value="live">Live</option>
                  <option value="in-development">In development</option>
                </select>
              </Field>
              <Field label="Industry">
                <input className={inputClass} value={current.industry} onChange={(e) => update({ industry: e.target.value })} />
              </Field>
              <Field label="Country">
                <input className={inputClass} value={current.country} onChange={(e) => update({ country: e.target.value })} />
              </Field>
              <Field label="Live URL" hint="Required for live projects to appear" className="md:col-span-2">
                <input className={inputClass} type="url" placeholder="https://" value={current.liveUrl} onChange={(e) => update({ liveUrl: e.target.value.trim() })} />
              </Field>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-forest mb-2">Services (filter chips)</legend>
              <div className="flex flex-wrap gap-2">
                {projectTags.map((tag) => {
                  const checked = current.services.includes(tag)
                  return (
                    <label key={tag} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium cursor-pointer", checked ? "border-forest bg-forest text-neutral" : "border-sage/40 text-forest")}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => update({ services: checked ? current.services.filter((s) => s !== tag) : [...current.services, tag] })}
                      />
                      {tag}
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <Field label="Summary" hint={`${current.summary.length}/400 characters`}>
              <textarea rows={4} maxLength={400} className={inputClass} value={current.summary} onChange={(e) => update({ summary: e.target.value })} />
            </Field>
            <Field label="Tech stack" hint="Comma-separated, e.g. MongoDB, Express.js, React, Node.js">
              <input className={inputClass} value={current.stack} onChange={(e) => update({ stack: e.target.value })} />
            </Field>
            <Field label="Result (optional)" hint="Real, verifiable results only">
              <input className={inputClass} value={current.result} onChange={(e) => update({ result: e.target.value })} />
            </Field>

            <div>
              <p className="text-sm font-semibold text-forest mb-2">Screenshot</p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="relative w-full sm:w-64 aspect-[1200/630] rounded-xl overflow-hidden bg-neutral border border-sage/25 flex items-center justify-center">
                  {current.image ? (
                    <Image src={current.image.src} alt={current.image.alt} width={current.image.width} height={current.image.height} className="w-full h-full object-cover object-top" />
                  ) : (
                    <span className="text-xs text-charcoal/70">No screenshot</span>
                  )}
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="project-image" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                  <div className="flex flex-wrap gap-2">
                    <label
                      htmlFor="project-image"
                      className={cn("inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-neutral cursor-pointer", (!canSave || uploading) && "pointer-events-none opacity-50")}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <ImagePlus className="w-4 h-4" aria-hidden />}
                      {uploading ? "Uploading…" : current.image ? "Replace image" : "Upload image"}
                    </label>
                    {current.image && (
                      <button type="button" onClick={() => update({ image: undefined })} className="rounded-lg border border-sage/40 px-4 py-2 text-sm font-semibold text-forest">
                        Remove
                      </button>
                    )}
                  </div>
                  {uploadError && <p role="alert" className="text-sm font-medium text-charcoal">⚠ {uploadError}</p>}
                  {current.image && (
                    <Field label="Image description (alt text)">
                      <input className={inputClass} value={current.image.alt} onChange={(e) => current.image && update({ image: { ...current.image, alt: e.target.value } })} />
                    </Field>
                  )}
                  <p className="text-xs text-charcoal/70">PNG, JPG or WebP. Resized to 1600px wide before upload. A 1200×630 desktop screenshot looks best.</p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl bg-neutral p-4">
              <input type="checkbox" className="mt-0.5 w-4 h-4 accent-forest" checked={current.shareable} onChange={(e) => update({ shareable: e.target.checked })} />
              <span className="text-sm">
                <span className="block font-semibold text-forest">Show on the website</span>
                Only tick this if the client agreed to be shown. Live projects also need a live URL.
              </span>
            </label>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-sage/40 p-10 text-center text-charcoal/80">Add a project to get started.</p>
        )}
      </div>

      <SaveBar dirty={dirty} saving={saving} disabled={!canSave} result={result} onSave={save} />
    </>
  )
}
