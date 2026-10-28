import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"

// Admin accounts. Owners can do everything; members can't see money pages or
// manage the team. Secrets (password hash, 2FA secret) never leave this module.

export type Role = "owner" | "member"

type UserDoc = {
  _id: ObjectId
  name: string
  email: string
  role: Role
  passwordHash: string
  sessionVersion: number
  totpSecret?: string
  totpEnabled: boolean
  active: boolean
  createdAt: Date
  lastLoginAt?: Date
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: Role
  sessionVersion: number
  totpEnabled: boolean
  active: boolean
  createdAt: Date
  lastLoginAt?: Date
}

let indexReady: Promise<unknown> | null = null
async function users() {
  const collection = (await getDb()).collection<UserDoc>("users")
  indexReady ??= collection.createIndex({ email: 1 }, { unique: true })
  await indexReady
  return collection
}

const toAdminUser = ({ _id, passwordHash: _p, totpSecret: _t, ...rest }: UserDoc): AdminUser => ({ id: _id.toString(), ...rest })
const normaliseEmail = (email: string) => email.trim().toLowerCase()

export async function countUsers() {
  return (await users()).countDocuments()
}

export async function listUsers() {
  return (await (await users()).find({}).sort({ createdAt: 1 }).toArray()).map(toAdminUser)
}

export async function getUserById(id: string) {
  if (!ObjectId.isValid(id)) return null
  const doc = await (await users()).findOne({ _id: new ObjectId(id) })
  return doc ? toAdminUser(doc) : null
}

// Only for sign-in: returns the stored hash and 2FA secret alongside the user.
export async function getUserCredentials(email: string) {
  const doc = await (await users()).findOne({ email: normaliseEmail(email) })
  return doc ? { user: toAdminUser(doc), passwordHash: doc.passwordHash, totpSecret: doc.totpSecret } : null
}

export async function getTotpSecret(id: string) {
  const doc = await (await users()).findOne({ _id: new ObjectId(id) }, { projection: { totpSecret: 1 } })
  return doc?.totpSecret ?? null
}

export async function createUser(input: { name: string; email: string; password: string; role: Role }) {
  const doc: Omit<UserDoc, "_id"> = {
    name: input.name.trim(),
    email: normaliseEmail(input.email),
    role: input.role,
    passwordHash: await hashPassword(input.password),
    sessionVersion: 1,
    totpEnabled: false,
    active: true,
    createdAt: new Date(),
  }
  const result = await (await users()).insertOne(doc as UserDoc)
  return result.insertedId.toString()
}

export async function updateUser(id: string, patch: Partial<Pick<UserDoc, "name" | "email" | "role" | "active">>) {
  const set = { ...patch, ...(patch.email && { email: normaliseEmail(patch.email) }) }
  await (await users()).updateOne({ _id: new ObjectId(id) }, { $set: set, ...(patch.active === false && { $inc: { sessionVersion: 1 } }) })
}

// Changing the password signs the user out everywhere.
export async function setPassword(id: string, password: string) {
  await (await users()).updateOne({ _id: new ObjectId(id) }, { $set: { passwordHash: await hashPassword(password) }, $inc: { sessionVersion: 1 } })
}

export async function signOutEverywhere(id: string) {
  await (await users()).updateOne({ _id: new ObjectId(id) }, { $inc: { sessionVersion: 1 } })
}

export async function setTotp(id: string, secret: string | null) {
  await (await users()).updateOne(
    { _id: new ObjectId(id) },
    secret ? { $set: { totpSecret: secret, totpEnabled: true } } : { $set: { totpEnabled: false }, $unset: { totpSecret: "" } },
  )
}

export async function recordLogin(id: string) {
  await (await users()).updateOne({ _id: new ObjectId(id) }, { $set: { lastLoginAt: new Date() } })
}
