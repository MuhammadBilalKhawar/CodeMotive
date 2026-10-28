import { ObjectId, Binary, type Filter } from "mongodb"
import { getDb, isDbConfigured } from "@/lib/db"
import type { ReplySource } from "@/lib/ai/generateReply"
import { openStages, type ManualLead, type Money, type Source, type Stage } from "@/lib/crm/schemas"

// Every enquiry (website forms and leads added by hand), so nothing is lost if
// an email or Jira call fails. Worked as a sales pipeline in /admin/leads.

export type DeliveryStatus = "sent" | "failed" | "skipped"

export type LeadDoc = {
  kind: "contact" | "mockup" | "manual"
  createdAt: Date
  name: string
  email: string
  // Label/value pairs in display order (same as the owner email). Kept as received.
  fields: [string, string][]
  reply: string
  replySource: ReplySource | "none"
  ipCountry: string | null
  logoId?: string
  taskUrl?: string
  ownerEmail?: DeliveryStatus
  visitorEmail?: DeliveryStatus

  // CRM fields. Older leads don't have them; see withDefaults().
  phone?: string
  business?: string
  service?: string
  source?: Source
  stage?: Stage
  lostReason?: string
  value?: Money
  // Admin user responsible for the lead.
  ownerId?: string
  // Next follow-up, "YYYY-MM-DD" in Pakistan time.
  followUpOn?: string
  tags?: string[]
  clientId?: string
  stageChangedAt?: Date
  updatedAt?: Date
  createdBy?: string
}

export type Lead = Omit<LeadDoc, "phone" | "business" | "service" | "source" | "stage" | "lostReason" | "value" | "ownerId" | "followUpOn" | "tags"> & {
  id: string
  phone: string
  business: string
  service: string
  source: Source
  stage: Stage
  lostReason: string
  value: Money
  ownerId: string
  followUpOn: string
  tags: string[]
}

const leads = async () => (await getDb()).collection<LeadDoc>("leads")

const field = (doc: LeadDoc, ...labels: string[]) => doc.fields.find(([label]) => labels.includes(label))?.[1] ?? ""

// Fills CRM fields for leads saved before the CRM existed, from the form answers.
function withDefaults({ _id, ...doc }: LeadDoc & { _id: ObjectId }): Lead {
  return {
    ...doc,
    id: _id.toString(),
    phone: doc.phone ?? field(doc, "WhatsApp / phone", "WhatsApp"),
    business: doc.business ?? field(doc, "Business"),
    service: doc.service ?? field(doc, "Service", "Business type"),
    source: doc.source ?? (doc.kind === "mockup" ? "mockup" : "website"),
    stage: doc.stage ?? "new",
    lostReason: doc.lostReason ?? "",
    value: doc.value ?? null,
    ownerId: doc.ownerId ?? "",
    followUpOn: doc.followUpOn ?? "",
    tags: doc.tags ?? [],
  }
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export async function saveLead(lead: LeadDoc) {
  if (!isDbConfigured()) return null
  const result = await (await leads()).insertOne({ stage: "new", ...lead, updatedAt: lead.createdAt })
  return result.insertedId.toString()
}

export async function updateLead(id: string | null, patch: Partial<LeadDoc>) {
  if (!id || !isDbConfigured() || !ObjectId.isValid(id)) return
  await (await leads()).updateOne({ _id: new ObjectId(id) }, { $set: { ...patch, updatedAt: new Date() } })
}

export type LeadFilter = { stage?: Stage; source?: Source; ownerId?: string; q?: string; clientId?: string }

export async function listLeads({ stage, source, ownerId, q, clientId }: LeadFilter = {}, limit = 500) {
  if (!isDbConfigured()) return []
  const and: Filter<LeadDoc>[] = []
  // Older leads have no stage or source stored (see withDefaults).
  if (stage) and.push(stage === "new" ? { $or: [{ stage }, { stage: { $exists: false } }] } : { stage })
  if (source === "website" || source === "mockup") {
    and.push({ $or: [{ source }, { source: { $exists: false }, kind: source === "website" ? "contact" : "mockup" }] })
  } else if (source) and.push({ source })
  if (ownerId) and.push({ ownerId })
  if (clientId) and.push({ clientId })
  if (q?.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), "i")
    // Form answers are [label, value] pairs, so older leads are found by phone or business too.
    and.push({ $or: [{ name: pattern }, { email: pattern }, { business: pattern }, { phone: pattern }, { fields: { $elemMatch: { $elemMatch: { $regex: pattern } } } }] })
  }
  const docs = await (await leads()).find(and.length ? { $and: and } : {}).sort({ createdAt: -1 }).limit(limit).toArray()
  return docs.map(withDefaults)
}

export async function getLead(id: string) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null
  const doc = await (await leads()).findOne({ _id: new ObjectId(id) })
  return doc ? withDefaults(doc) : null
}

export async function createManualLead(input: ManualLead, createdBy: string) {
  const { note: _note, ...lead } = input
  const fields: [string, string][] = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["WhatsApp / phone", lead.phone],
    ["Business", lead.business],
    ["Service", lead.service],
  ]
  const now = new Date()
  const result = await (await leads()).insertOne({
    ...lead,
    kind: "manual",
    createdAt: now,
    updatedAt: now,
    stageChangedAt: now,
    fields: fields.filter(([, v]) => v),
    reply: "",
    replySource: "none",
    ipCountry: null,
    createdBy,
  })
  return result.insertedId.toString()
}

// Open leads whose follow-up date is today or earlier, soonest first.
export async function dueFollowUps(today: string) {
  if (!isDbConfigured()) return []
  const docs = await (await leads())
    .find({ followUpOn: { $ne: "", $lte: today }, $or: [{ stage: { $in: openStages } }, { stage: { $exists: false } }] })
    .sort({ followUpOn: 1 })
    .limit(100)
    .toArray()
  return docs.map(withDefaults)
}

// New leads nobody has contacted yet, created before `before`.
export async function uncontactedLeads(before: Date) {
  if (!isDbConfigured()) return []
  const docs = await (await leads())
    .find({ createdAt: { $lte: before }, $or: [{ stage: "new" }, { stage: { $exists: false } }] })
    .sort({ createdAt: 1 })
    .limit(100)
    .toArray()
  return docs.map(withDefaults)
}

export async function deleteLead(id: string) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return
  const db = await getDb()
  const lead = await (await leads()).findOneAndDelete({ _id: new ObjectId(id) })
  if (lead?.logoId && ObjectId.isValid(lead.logoId)) {
    await db.collection("uploads").deleteOne({ _id: new ObjectId(lead.logoId) })
  }
  await db.collection("timeline").deleteMany({ subject: "lead", subjectId: id })
}

// Visitor uploads (mockup logos) are private: served only to signed-in admins.
export async function saveUpload(file: { data: Uint8Array; contentType: string; filename: string }) {
  if (!isDbConfigured()) return null
  const result = await (await getDb()).collection("uploads").insertOne({
    contentType: file.contentType,
    filename: file.filename,
    data: new Binary(file.data),
    size: file.data.byteLength,
    createdAt: new Date(),
  })
  return result.insertedId.toString()
}
