"use server"

import { revalidatePath } from "next/cache"
import type { z } from "zod"
import { isDbConfigured } from "@/lib/db"
import { isActionError, userForAction } from "@/lib/auth/current"
import { logActivity } from "@/lib/audit"
import { createManualLead, getLead, updateLead } from "@/lib/leads"
import { addTimeline } from "@/lib/crm/timeline"
import { createClient, deleteClient, getClient, updateClient } from "@/lib/crm/clients"
import { changeLeadStage as changeStage, convertLead } from "@/lib/crm/convert"
import {
  clientSchema,
  contactNoteTypes,
  leadEditSchema,
  manualLeadSchema,
  noteSchema,
  noteTypeLabels,
  stageLabels,
  stages,
  type Stage,
} from "@/lib/crm/schemas"
import type { ActionResult } from "@/app/admin/actions/types"

// Sales pipeline: leads, their timeline, and clients.

const fieldLabels: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  business: "Business",
  service: "Service",
  lostReason: "Reason lost",
  value: "Deal value",
  followUpOn: "Follow-up date",
  tags: "Tags",
  note: "Note",
  text: "Note",
  address: "Address",
  country: "Country",
  notes: "Notes",
}

const describe = (error: z.ZodError) =>
  error.issues
    .slice(0, 4)
    .map((issue) => `${fieldLabels[String(issue.path[0])] ?? "Form"}: ${issue.message}`)
    .join("\n")

async function crmUser() {
  const user = await userForAction()
  if (isActionError(user)) return user
  if (!isDbConfigured()) return { ok: false as const, error: "The database isn't connected." }
  return user
}

function refreshLeads(id?: string) {
  revalidatePath("/admin/leads")
  revalidatePath("/admin")
  if (id) revalidatePath(`/admin/leads/${id}`)
}

function refreshClients(id?: string) {
  revalidatePath("/admin/clients")
  if (id) revalidatePath(`/admin/clients/${id}`)
}

export async function createLeadAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await crmUser()
  if ("ok" in user) return user
  const parsed = manualLeadSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }

  const id = await createManualLead(parsed.data, user.name)
  await addTimeline("lead", id, { type: "system", text: `Added by hand (${parsed.data.source})`, by: user.name })
  if (parsed.data.note) await addTimeline("lead", id, { type: "note", text: parsed.data.note, by: user.name })
  await logActivity(user, { action: "created", entity: "lead", entityId: id, summary: `${user.name} added the lead ${parsed.data.name}` })
  refreshLeads()
  return { ok: true, data: { id } }
}

export async function updateLeadAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await crmUser()
  if ("ok" in user) return user
  const lead = await getLead(id)
  if (!lead) return { ok: false, error: "That lead no longer exists." }
  const parsed = leadEditSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }

  const { stage, lostReason, ...rest } = parsed.data
  await updateLead(id, rest)
  if (stage !== lead.stage) await changeStage(id, lead.stage, stage, user.name, lostReason)
  else if (stage === "lost" && lostReason !== lead.lostReason) await updateLead(id, { lostReason })
  if (rest.followUpOn !== lead.followUpOn && rest.followUpOn) {
    await addTimeline("lead", id, { type: "system", text: `Follow-up set for ${rest.followUpOn}`, by: user.name })
  }
  await logActivity(user, { action: "updated", entity: "lead", entityId: id, summary: `${user.name} updated the lead ${parsed.data.name}` })
  refreshLeads(id)
  return { ok: true }
}

// From the pipeline board (drag and drop).
export async function setLeadStageAction(id: string, stage: Stage, lostReason = ""): Promise<ActionResult> {
  const user = await crmUser()
  if ("ok" in user) return user
  if (!stages.includes(stage)) return { ok: false, error: "Unknown stage." }
  const lead = await getLead(id)
  if (!lead) return { ok: false, error: "That lead no longer exists." }
  if (lead.stage === stage) return { ok: true }
  await changeStage(id, lead.stage, stage, user.name, lostReason.trim().slice(0, 300))
  await logActivity(user, { action: "moved", entity: "lead", entityId: id, summary: `${user.name} moved ${lead.name} to ${stageLabels[stage]}` })
  refreshLeads(id)
  return { ok: true }
}

export async function addLeadNoteAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await crmUser()
  if ("ok" in user) return user
  const lead = await getLead(id)
  if (!lead) return { ok: false, error: "That lead no longer exists." }
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }

  await addTimeline("lead", id, { ...parsed.data, by: user.name })
  // Logging a call or message means the lead has been contacted.
  if (lead.stage === "new" && contactNoteTypes.includes(parsed.data.type)) await changeStage(id, "new", "contacted", user.name)
  else await updateLead(id, {})
  await logActivity(user, { action: "logged", entity: "lead", entityId: id, summary: `${user.name} logged a ${noteTypeLabels[parsed.data.type].toLowerCase()} for ${lead.name}` })
  refreshLeads(id)
  return { ok: true }
}

// Links the lead to a client (an existing one with the same email, or a new
// one from the lead's details) and marks it won.
export async function convertLeadAction(id: string): Promise<ActionResult<{ clientId: string; existing: boolean }>> {
  const user = await crmUser()
  if ("ok" in user) return user
  const result = await convertLead(id, user.name)
  if (!result) return { ok: false, error: "That lead no longer exists." }
  if (!result.existing || result.lead.clientId !== result.clientId) {
    await logActivity(user, { action: "converted", entity: "lead", entityId: id, summary: `${user.name} converted ${result.lead.name} to a client` })
  }
  refreshLeads(id)
  refreshClients(result.clientId)
  return { ok: true, data: { clientId: result.clientId, existing: result.existing } }
}

export async function createClientAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await crmUser()
  if ("ok" in user) return user
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  const id = await createClient(parsed.data, user.name)
  await addTimeline("client", id, { type: "system", text: "Client added", by: user.name })
  await logActivity(user, { action: "created", entity: "client", entityId: id, summary: `${user.name} added the client ${parsed.data.business || parsed.data.name}` })
  refreshClients()
  return { ok: true, data: { id } }
}

export async function updateClientAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await crmUser()
  if ("ok" in user) return user
  if (!(await getClient(id))) return { ok: false, error: "That client no longer exists." }
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  await updateClient(id, parsed.data)
  await logActivity(user, { action: "updated", entity: "client", entityId: id, summary: `${user.name} updated the client ${parsed.data.business || parsed.data.name}` })
  refreshClients(id)
  return { ok: true }
}

export async function addClientNoteAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await crmUser()
  if ("ok" in user) return user
  const client = await getClient(id)
  if (!client) return { ok: false, error: "That client no longer exists." }
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: describe(parsed.error) }
  await addTimeline("client", id, { ...parsed.data, by: user.name })
  await logActivity(user, { action: "logged", entity: "client", entityId: id, summary: `${user.name} logged a ${noteTypeLabels[parsed.data.type].toLowerCase()} for ${client.business || client.name}` })
  refreshClients(id)
  return { ok: true }
}

// Owners only. Linked leads are kept.
export async function deleteClientAction(id: string): Promise<ActionResult> {
  const user = await userForAction("owner")
  if (isActionError(user)) return user
  const client = await getClient(id)
  if (!client) return { ok: true }
  await deleteClient(id)
  await logActivity(user, { action: "deleted", entity: "client", entityId: id, summary: `${user.name} deleted the client ${client.business || client.name}` })
  refreshClients()
  refreshLeads()
  return { ok: true }
}
