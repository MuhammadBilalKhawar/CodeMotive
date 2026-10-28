"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import type { z } from "zod"
import { isDbConfigured } from "@/lib/db"
import { isActionError, userForAction } from "@/lib/auth/current"
import type { AdminUser } from "@/lib/auth/users"
import { logActivity } from "@/lib/audit"
import { addTimeline } from "@/lib/crm/timeline"
import { getClient } from "@/lib/crm/clients"
import { noteSchema, pakistanDate } from "@/lib/crm/schemas"
import { getQuote } from "@/lib/billing/store"
import { money } from "@/lib/billing/schemas"
import {
  carePlanInputSchema,
  checklistItemSchema,
  expenseSchema,
  projectInputSchema,
  projectStageLabels,
  projectStages,
  renewalInputSchema,
  type ProjectKind,
  type ProjectStage,
} from "@/lib/delivery/schemas"
import {
  createCarePlan,
  createProject,
  createRenewal,
  deleteCarePlan,
  deleteProject,
  deleteRenewal,
  findProjectByQuote,
  getCarePlan,
  getProject,
  getRenewal,
  updateCarePlan,
  updateProject,
  updateRenewal,
  type Project,
} from "@/lib/delivery/store"
import { invoiceCarePlan } from "@/lib/delivery/care-billing"
import type { ActionResult } from "@/app/admin/actions/types"

// Delivery: client projects (everyone), care plans and project costs (owners), renewals (everyone).

const fieldLabels: Record<string, string> = {
  name: "Name",
  clientId: "Client",
  dueDate: "Deadline",
  startDate: "Start date",
  links: "Links",
  notes: "Notes",
  handoverNotes: "Handover notes",
  description: "Description",
  amount: "Amount",
  date: "Date",
  nextInvoiceOn: "Next invoice",
  renewsOn: "Renews on",
  cost: "Cost",
  text: "Task",
}

const describe = (error: z.ZodError) =>
  error.issues
    .slice(0, 4)
    .map((issue) => `${fieldLabels[String(issue.path[0])] ?? "Form"}${issue.path[0] === "links" ? ` › ${String(issue.path[1])}` : ""}: ${issue.message}`)
    .join("\n")

async function deliveryUser(role?: "owner") {
  const user = await userForAction(role)
  if (isActionError(user)) return user
  if (!isDbConfigured()) return { ok: false as const, error: "The database isn't connected." }
  return user
}

const log = (user: AdminUser, action: string, entity: string, entityId: string, summary: string) => logActivity(user, { action, entity, entityId, summary: `${user.name} ${summary}` })

function refresh(...paths: string[]) {
  for (const path of ["/admin/projects", "/admin/care-plans", "/admin/renewals", "/admin", ...paths]) revalidatePath(path)
}

async function loadProject(id: string) {
  const project = await getProject(id)
  return project ?? ({ ok: false as const, error: "That project no longer exists." })
}

// Moving to "launched" records the date (and moving back clears it).
async function changeStage(project: Project, stage: ProjectStage, by: string) {
  await updateProject(project.id, { stage, launchedOn: stage === "launched" ? pakistanDate() : undefined })
  await addTimeline("project", project.id, { type: "stage", text: `${projectStageLabels[project.stage]} → ${projectStageLabels[stage]}`, by })
  if (stage === "launched") await addTimeline("client", project.clientId, { type: "system", text: `Project launched: ${project.name}`, by })
}

// --- Projects ----------------------------------------------------------------

export async function createProjectAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const parsed = projectInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  if (!(await getClient(parsed.data.clientId))) return { ok: false, error: "Client: pick an existing client." }
  const id = await createProject(parsed.data, user.name)
  await addTimeline("project", id, { type: "system", text: "Project created", by: user.name })
  await addTimeline("client", parsed.data.clientId, { type: "system", text: `Project started: ${parsed.data.name}`, by: user.name })
  await log(user, "created", "project", id, `started the project ${parsed.data.name}`)
  refresh(`/admin/clients/${parsed.data.clientId}`)
  return { ok: true, data: { id } }
}

// From an accepted quote: the quote's title, client and a checklist that fits.
export async function startProjectFromQuoteAction(quoteId: string): Promise<ActionResult<{ id: string }>> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const quote = await getQuote(quoteId)
  if (!quote) return { ok: false, error: "That quote no longer exists." }
  if (quote.status !== "accepted" || !quote.clientId) return { ok: false, error: "Start a project once the quote is accepted." }
  const existing = await findProjectByQuote(quoteId)
  if (existing) return { ok: true, data: { id: existing.id } }

  const text = quote.items.map((i) => `${i.description} ${i.details}`).join(" ")
  const kind: ProjectKind = /shopify|store|e-?commerce/i.test(text) ? "shopify" : /website|page|landing/i.test(text) ? "website" : "other"
  const id = await createProject(
    {
      name: quote.title,
      clientId: quote.clientId,
      quoteId,
      kind,
      stage: "planning",
      ownerId: user.id,
      startDate: pakistanDate(),
      dueDate: "",
      links: { live: "", staging: "", jira: "", repo: "", design: "" },
      notes: quote.notes,
      handoverNotes: "",
    },
    user.name,
  )
  await addTimeline("project", id, { type: "system", text: `Started from quote ${quote.number} (${money(quote.total, quote.currency)})`, by: user.name })
  await addTimeline("client", quote.clientId, { type: "system", text: `Project started: ${quote.title}`, by: user.name })
  await log(user, "created", "project", id, `started the project ${quote.title} from quote ${quote.number}`)
  refresh(`/admin/quotes/${quoteId}`)
  return { ok: true, data: { id } }
}

export async function updateProjectAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const project = await loadProject(id)
  if ("ok" in project) return project
  const parsed = projectInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  const { stage, ...rest } = parsed.data
  await updateProject(id, rest)
  if (stage !== project.stage) await changeStage(project, stage, user.name)
  if (rest.dueDate !== project.dueDate && rest.dueDate) await addTimeline("project", id, { type: "system", text: `Deadline set to ${rest.dueDate}`, by: user.name })
  await log(user, "updated", "project", id, `updated the project ${parsed.data.name}`)
  refresh(`/admin/projects/${id}`)
  return { ok: true }
}

export async function setProjectStageAction(id: string, stage: ProjectStage): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  if (!projectStages.includes(stage)) return { ok: false, error: "Unknown stage." }
  const project = await loadProject(id)
  if ("ok" in project) return project
  if (project.stage !== stage) await changeStage(project, stage, user.name)
  await log(user, "moved", "project", id, `moved ${project.name} to ${projectStageLabels[stage]}`)
  refresh(`/admin/projects/${id}`)
  return { ok: true }
}

export async function toggleChecklistAction(id: string, itemId: string, done: boolean): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const project = await loadProject(id)
  if ("ok" in project) return project
  const item = project.checklist.find((i) => i.id === itemId)
  if (!item) return { ok: false, error: "That task no longer exists." }
  const checklist = project.checklist.map((i) => (i.id === itemId ? { ...i, done, doneAt: done ? new Date() : undefined, doneBy: done ? user.name : undefined } : i))
  await updateProject(id, { checklist })
  if (done) await addTimeline("project", id, { type: "system", text: `Done: ${item.text}`, by: user.name })
  refresh(`/admin/projects/${id}`)
  return { ok: true }
}

export async function addChecklistItemAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const project = await loadProject(id)
  if ("ok" in project) return project
  const parsed = checklistItemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  if (project.checklist.length >= 60) return { ok: false, error: "That's the most tasks a project can have." }
  await updateProject(id, { checklist: [...project.checklist, { id: randomUUID(), text: parsed.data.text, done: false }] })
  refresh(`/admin/projects/${id}`)
  return { ok: true }
}

export async function removeChecklistItemAction(id: string, itemId: string): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const project = await loadProject(id)
  if ("ok" in project) return project
  await updateProject(id, { checklist: project.checklist.filter((i) => i.id !== itemId) })
  refresh(`/admin/projects/${id}`)
  return { ok: true }
}

export async function addProjectNoteAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const project = await loadProject(id)
  if ("ok" in project) return project
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  await addTimeline("project", id, { ...parsed.data, by: user.name })
  await updateProject(id, {})
  refresh(`/admin/projects/${id}`)
  return { ok: true }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const user = await deliveryUser("owner")
  if ("ok" in user) return user
  const project = await getProject(id)
  if (!project) return { ok: true }
  await deleteProject(id)
  await log(user, "deleted", "project", id, `deleted the project ${project.name}`)
  refresh()
  return { ok: true }
}

// --- Project costs (owners) --------------------------------------------------

export async function addExpenseAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await deliveryUser("owner")
  if ("ok" in user) return user
  const project = await loadProject(id)
  if ("ok" in project) return project
  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  await updateProject(id, { expenses: [...project.expenses, { ...parsed.data, id: randomUUID(), recordedBy: user.name }] })
  await log(user, "recorded", "project", id, `recorded a ${money(parsed.data.amount, parsed.data.currency)} cost on ${project.name}`)
  refresh(`/admin/projects/${id}`)
  return { ok: true }
}

export async function removeExpenseAction(id: string, expenseId: string): Promise<ActionResult> {
  const user = await deliveryUser("owner")
  if ("ok" in user) return user
  const project = await loadProject(id)
  if ("ok" in project) return project
  await updateProject(id, { expenses: project.expenses.filter((e) => e.id !== expenseId) })
  refresh(`/admin/projects/${id}`)
  return { ok: true }
}

// --- Care plans (owners) -----------------------------------------------------

export async function createCarePlanAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await deliveryUser("owner")
  if ("ok" in user) return user
  const parsed = carePlanInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  if (!(await getClient(parsed.data.clientId))) return { ok: false, error: "Client: pick an existing client." }
  const id = await createCarePlan(parsed.data, user.name)
  await addTimeline("client", parsed.data.clientId, { type: "system", text: `Care plan added: ${parsed.data.name} (${money(parsed.data.amount, parsed.data.currency)} ${parsed.data.interval})`, by: user.name })
  await log(user, "created", "care-plan", id, `added the care plan ${parsed.data.name}`)
  refresh(`/admin/clients/${parsed.data.clientId}`)
  return { ok: true, data: { id } }
}

export async function updateCarePlanAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await deliveryUser("owner")
  if ("ok" in user) return user
  const plan = await getCarePlan(id)
  if (!plan) return { ok: false, error: "That care plan no longer exists." }
  const parsed = carePlanInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  await updateCarePlan(id, parsed.data)
  if (parsed.data.status !== plan.status) await addTimeline("client", plan.clientId, { type: "system", text: `Care plan ${parsed.data.name} ${parsed.data.status}`, by: user.name })
  await log(user, "updated", "care-plan", id, `updated the care plan ${parsed.data.name}`)
  refresh(`/admin/clients/${plan.clientId}`)
  return { ok: true }
}

// Bills the plan's next period straight away (otherwise the daily job does it).
export async function invoiceCarePlanNowAction(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await deliveryUser("owner")
  if ("ok" in user) return user
  const plan = await getCarePlan(id)
  if (!plan) return { ok: false, error: "That care plan no longer exists." }
  if (plan.status !== "active") return { ok: false, error: "Only active plans are invoiced." }
  const result = await invoiceCarePlan(plan, user.name)
  if (!result) return { ok: false, error: "That period was just invoiced. Refresh the page." }
  await log(user, "invoiced", "care-plan", id, `invoiced the care plan ${plan.name}`)
  refresh("/admin/invoices")
  return { ok: true, data: { id: result.invoiceId } }
}

export async function deleteCarePlanAction(id: string): Promise<ActionResult> {
  const user = await deliveryUser("owner")
  if ("ok" in user) return user
  const plan = await getCarePlan(id)
  if (!plan) return { ok: true }
  await deleteCarePlan(id)
  await log(user, "deleted", "care-plan", id, `deleted the care plan ${plan.name}`)
  refresh(`/admin/clients/${plan.clientId}`)
  return { ok: true }
}

// --- Renewals ----------------------------------------------------------------

export async function createRenewalAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const parsed = renewalInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  const id = await createRenewal(parsed.data, user.name)
  await log(user, "created", "renewal", id, `added the renewal ${parsed.data.name}`)
  refresh(parsed.data.clientId ? `/admin/clients/${parsed.data.clientId}` : "/admin/renewals")
  return { ok: true, data: { id } }
}

export async function updateRenewalAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  if (!(await getRenewal(id))) return { ok: false, error: "That renewal no longer exists." }
  const parsed = renewalInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  await updateRenewal(id, parsed.data)
  await log(user, "updated", "renewal", id, `updated the renewal ${parsed.data.name}`)
  refresh()
  return { ok: true }
}

// Renewed for another year: the date moves on by 12 months.
export async function markRenewedAction(id: string): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const renewal = await getRenewal(id)
  if (!renewal) return { ok: false, error: "That renewal no longer exists." }
  const [y, m, d] = renewal.renewsOn.split("-").map(Number)
  const lastDay = new Date(Date.UTC(y + 1, m, 0)).getUTCDate()
  const next = `${y + 1}-${String(m).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`
  await updateRenewal(id, { renewsOn: next, renewedAt: new Date() })
  if (renewal.clientId) await addTimeline("client", renewal.clientId, { type: "system", text: `Renewed ${renewal.name} until ${next}`, by: user.name })
  await log(user, "renewed", "renewal", id, `marked ${renewal.name} renewed until ${next}`)
  refresh()
  return { ok: true }
}

export async function deleteRenewalAction(id: string): Promise<ActionResult> {
  const user = await deliveryUser()
  if ("ok" in user) return user
  const renewal = await getRenewal(id)
  if (!renewal) return { ok: true }
  await deleteRenewal(id)
  await log(user, "deleted", "renewal", id, `deleted the renewal ${renewal.name}`)
  refresh()
  return { ok: true }
}
