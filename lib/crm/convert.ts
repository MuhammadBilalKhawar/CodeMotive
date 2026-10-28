import { getLead, updateLead } from "@/lib/leads"
import { addTimeline } from "@/lib/crm/timeline"
import { clientFromLead, createClient, findClientByEmail, getClient } from "@/lib/crm/clients"
import { stageLabels, type Stage } from "@/lib/crm/schemas"

// Stage change with its timeline entry. Moving a lead off "lost" clears the reason.
export async function changeLeadStage(id: string, from: Stage, to: Stage, by: string, lostReason = "") {
  await updateLead(id, { stage: to, stageChangedAt: new Date(), lostReason: to === "lost" ? lostReason : "" })
  const reason = to === "lost" && lostReason ? ` (${lostReason})` : ""
  await addTimeline("lead", id, { type: "stage", text: `${stageLabels[from]} → ${stageLabels[to]}${reason}`, by })
}

// Links a lead to a client (an existing one with the same email, or a new one
// from the lead's details) and marks it won. Returns null if the lead is gone.
export async function convertLead(leadId: string, by: string) {
  const lead = await getLead(leadId)
  if (!lead) return null
  if (lead.clientId && (await getClient(lead.clientId))) return { clientId: lead.clientId, existing: true, lead }

  const existing = await findClientByEmail(lead.email)
  const clientId = existing?.id ?? (await createClient(clientFromLead(lead), by))
  await updateLead(leadId, { clientId })
  if (lead.stage !== "won") await changeLeadStage(leadId, lead.stage, "won", by)
  await addTimeline("lead", leadId, { type: "system", text: existing ? `Linked to the existing client ${existing.name}` : "Converted to a client", by })
  await addTimeline("client", clientId, { type: "system", text: `Won from the lead ${lead.name}${lead.service ? ` (${lead.service})` : ""}`, by })
  return { clientId, existing: Boolean(existing), lead }
}
