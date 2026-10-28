import { randomUUID } from "node:crypto"
import { ObjectId, type Filter } from "mongodb"
import { getDb, isDbConfigured } from "@/lib/db"
import { pakistanDate } from "@/lib/crm/schemas"
import {
  checklistTemplates,
  daysUntil,
  type CarePlanInput,
  type ExpenseInput,
  type ProjectInput,
  type ProjectStage,
  type RenewalInput,
} from "@/lib/delivery/schemas"

// Client projects (not the portfolio, which is website content), care plans
// and renewals.

const byId = (id: string) => ({ _id: new ObjectId(id) })
const valid = (id: string) => isDbConfigured() && ObjectId.isValid(id)

// --- Projects ----------------------------------------------------------------

export type ChecklistItem = { id: string; text: string; done: boolean; doneAt?: Date; doneBy?: string }
export type Expense = ExpenseInput & { id: string; recordedBy: string }

type ProjectDoc = ProjectInput & {
  checklist: ChecklistItem[]
  expenses: Expense[]
  launchedOn?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
export type Project = ProjectDoc & { id: string; progress: number; daysLeft: number | null }

const projects = async () => (await getDb()).collection<ProjectDoc>("client_projects")

function toProject({ _id, ...doc }: ProjectDoc & { _id: ObjectId }, today = pakistanDate()): Project {
  const done = doc.checklist.filter((i) => i.done).length
  return {
    ...doc,
    id: _id.toString(),
    progress: doc.checklist.length ? Math.round((done / doc.checklist.length) * 100) : 0,
    daysLeft: doc.dueDate ? daysUntil(doc.dueDate, today) : null,
  }
}

export async function listProjects({ stage, clientId, ownerId }: { stage?: ProjectStage; clientId?: string; ownerId?: string } = {}) {
  if (!isDbConfigured()) return []
  const query: Filter<ProjectDoc> = {}
  if (stage) query.stage = stage
  if (clientId) query.clientId = clientId
  if (ownerId) query.ownerId = ownerId
  const today = pakistanDate()
  const docs = await (await projects()).find(query).sort({ createdAt: -1 }).limit(500).toArray()
  return docs.map((doc) => toProject(doc, today))
}

export async function getProject(id: string) {
  if (!valid(id)) return null
  const doc = await (await projects()).findOne(byId(id))
  return doc ? toProject(doc) : null
}

export async function findProjectByQuote(quoteId: string) {
  if (!isDbConfigured() || !quoteId) return null
  const doc = await (await projects()).findOne({ quoteId })
  return doc ? toProject(doc) : null
}

export async function createProject(input: ProjectInput, createdBy: string) {
  const now = new Date()
  const checklist = checklistTemplates[input.kind].map((text) => ({ id: randomUUID(), text, done: false }))
  const result = await (await projects()).insertOne({ ...input, checklist, expenses: [], createdAt: now, updatedAt: now, createdBy })
  return result.insertedId.toString()
}

export async function updateProject(id: string, patch: Partial<ProjectDoc>) {
  await (await projects()).updateOne(byId(id), { $set: { ...patch, updatedAt: new Date() } })
}

export async function deleteProject(id: string) {
  const db = await getDb()
  await (await projects()).deleteOne(byId(id))
  await db.collection("timeline").deleteMany({ subject: "project", subjectId: id })
}

// --- Care plans --------------------------------------------------------------

type CarePlanDoc = CarePlanInput & {
  // Invoices created for this plan, newest last.
  invoiceIds: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
export type CarePlan = CarePlanDoc & { id: string }

const carePlans = async () => (await getDb()).collection<CarePlanDoc>("care_plans")
const toPlan = ({ _id, ...doc }: CarePlanDoc & { _id: ObjectId }): CarePlan => ({ ...doc, id: _id.toString() })

export async function listCarePlans({ clientId, status }: { clientId?: string; status?: CarePlanInput["status"] } = {}) {
  if (!isDbConfigured()) return []
  const query: Filter<CarePlanDoc> = {}
  if (clientId) query.clientId = clientId
  if (status) query.status = status
  return (await (await carePlans()).find(query).sort({ nextInvoiceOn: 1 }).limit(500).toArray()).map(toPlan)
}

export async function getCarePlan(id: string) {
  if (!valid(id)) return null
  const doc = await (await carePlans()).findOne(byId(id))
  return doc ? toPlan(doc) : null
}

// Active plans whose next invoice is due today or earlier.
export async function carePlansDue(today: string) {
  if (!isDbConfigured()) return []
  return (await (await carePlans()).find({ status: "active", nextInvoiceOn: { $lte: today } }).toArray()).map(toPlan)
}

export async function createCarePlan(input: CarePlanInput, createdBy: string) {
  const now = new Date()
  const result = await (await carePlans()).insertOne({ ...input, invoiceIds: [], createdAt: now, updatedAt: now, createdBy })
  return result.insertedId.toString()
}

export async function updateCarePlan(id: string, patch: Partial<CarePlanDoc>) {
  await (await carePlans()).updateOne(byId(id), { $set: { ...patch, updatedAt: new Date() } })
}

// Moves the plan on to its next period, only if nobody else did first, so a
// repeated cron run (or a click at the same moment) can't bill a period twice.
export async function claimCarePlanPeriod(id: string, from: string, to: string) {
  const result = await (await carePlans()).updateOne({ ...byId(id), nextInvoiceOn: from }, { $set: { nextInvoiceOn: to, updatedAt: new Date() } })
  return result.modifiedCount === 1
}

export async function recordCarePlanInvoice(id: string, invoiceId: string) {
  await (await carePlans()).updateOne(byId(id), { $push: { invoiceIds: invoiceId } })
}

export async function deleteCarePlan(id: string) {
  await (await carePlans()).deleteOne(byId(id))
}

// --- Renewals ----------------------------------------------------------------

type RenewalDoc = RenewalInput & { createdAt: Date; updatedAt: Date; createdBy: string; renewedAt?: Date }
export type Renewal = RenewalDoc & { id: string; daysLeft: number }

const renewals = async () => (await getDb()).collection<RenewalDoc>("renewals")
const toRenewal = ({ _id, ...doc }: RenewalDoc & { _id: ObjectId }, today = pakistanDate()): Renewal => ({ ...doc, id: _id.toString(), daysLeft: daysUntil(doc.renewsOn, today) })

export async function listRenewals({ clientId, projectId }: { clientId?: string; projectId?: string } = {}) {
  if (!isDbConfigured()) return []
  const query: Filter<RenewalDoc> = {}
  if (clientId) query.clientId = clientId
  if (projectId) query.projectId = projectId
  const today = pakistanDate()
  return (await (await renewals()).find(query).sort({ renewsOn: 1 }).limit(500).toArray()).map((doc) => toRenewal(doc, today))
}

export async function getRenewal(id: string) {
  if (!valid(id)) return null
  const doc = await (await renewals()).findOne(byId(id))
  return doc ? toRenewal(doc) : null
}

export async function createRenewal(input: RenewalInput, createdBy: string) {
  const now = new Date()
  const result = await (await renewals()).insertOne({ ...input, createdAt: now, updatedAt: now, createdBy })
  return result.insertedId.toString()
}

export async function updateRenewal(id: string, patch: Partial<RenewalDoc>) {
  await (await renewals()).updateOne(byId(id), { $set: { ...patch, updatedAt: new Date() } })
}

export async function deleteRenewal(id: string) {
  await (await renewals()).deleteOne(byId(id))
}
