import { ObjectId, type Filter } from "mongodb"
import { getDb, isDbConfigured } from "@/lib/db"
import type { ClientInput } from "@/lib/crm/schemas"
import type { Lead } from "@/lib/leads"

// Businesses we've won. Leads convert into clients; quotes, invoices and
// projects (later phases) attach to them.

type ClientDoc = ClientInput & {
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export type Client = ClientDoc & { id: string }

const clients = async () => (await getDb()).collection<ClientDoc>("clients")
const toClient = ({ _id, ...doc }: ClientDoc & { _id: ObjectId }): Client => ({ id: _id.toString(), ...doc })
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export async function listClients({ q, status }: { q?: string; status?: ClientInput["status"] } = {}) {
  if (!isDbConfigured()) return []
  const and: Filter<ClientDoc>[] = []
  if (status) and.push({ status })
  if (q?.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), "i")
    and.push({ $or: [{ name: pattern }, { business: pattern }, { email: pattern }, { phone: pattern }] })
  }
  const docs = await (
    await clients()
  )
    .find(and.length ? { $and: and } : {})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray()
  return docs.map(toClient)
}

export async function getClient(id: string) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null
  const doc = await (await clients()).findOne({ _id: new ObjectId(id) })
  return doc ? toClient(doc) : null
}

export async function findClientByEmail(email: string) {
  if (!email || !isDbConfigured()) return null
  const doc = await (await clients()).findOne({ email: new RegExp(`^${escapeRegex(email.trim())}$`, "i") })
  return doc ? toClient(doc) : null
}

export async function createClient(input: ClientInput, createdBy: string) {
  const now = new Date()
  const result = await (await clients()).insertOne({ ...input, createdAt: now, updatedAt: now, createdBy })
  return result.insertedId.toString()
}

export async function updateClient(id: string, input: ClientInput) {
  if (!ObjectId.isValid(id)) return
  await (await clients()).updateOne({ _id: new ObjectId(id) }, { $set: { ...input, updatedAt: new Date() } })
}

export async function deleteClient(id: string) {
  if (!ObjectId.isValid(id)) return
  const db = await getDb()
  await (await clients()).deleteOne({ _id: new ObjectId(id) })
  // The leads stay; they just aren't linked any more.
  await db.collection("leads").updateMany({ clientId: id }, { $unset: { clientId: "" } })
  await db.collection("timeline").deleteMany({ subject: "client", subjectId: id })
}

// A new client's details, taken from the lead.
export function clientFromLead(lead: Lead): ClientInput {
  const country = lead.fields.find(([label]) => label === "Country" || label === "City and country")?.[1] ?? ""
  const inPakistan = /pakistan/i.test(country) || lead.ipCountry === "PK"
  return {
    name: lead.name,
    business: lead.business,
    email: lead.email,
    phone: lead.phone,
    country,
    currency: lead.value?.currency ?? (inPakistan ? "PKR" : "USD"),
    address: "",
    status: "active",
    notes: "",
    tags: lead.tags,
  }
}
