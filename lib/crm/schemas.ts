import { z } from "zod"

// Shapes and labels for the CRM (leads, clients, timeline). No server imports,
// so the admin forms use the same checks as the save actions.

export const stages = ["new", "contacted", "quoted", "won", "lost"] as const
export type Stage = (typeof stages)[number]
export const stageLabels: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quote sent",
  won: "Won",
  lost: "Lost",
}
// Leads still being worked on (shown in follow-ups and the digest).
export const openStages: Stage[] = ["new", "contacted", "quoted"]

export const sources = ["website", "mockup", "whatsapp", "instagram", "linkedin", "referral", "upwork", "other"] as const
export type Source = (typeof sources)[number]
export const sourceLabels: Record<Source, string> = {
  website: "Website form",
  mockup: "Free mockup",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  referral: "Referral",
  upwork: "Upwork",
  other: "Other",
}

export const noteTypes = ["note", "call", "whatsapp", "email", "meeting"] as const
export type NoteType = (typeof noteTypes)[number]
export const noteTypeLabels: Record<NoteType, string> = {
  note: "Note",
  call: "Call",
  whatsapp: "WhatsApp",
  email: "Email",
  meeting: "Meeting",
}
// Logging one of these on a "new" lead moves it to "contacted".
export const contactNoteTypes: NoteType[] = ["call", "whatsapp", "email", "meeting"]

export const currencies = ["PKR", "USD"] as const

const tooLong = (max: number) => `Keep it to ${max} characters or fewer`
const optional = (max: number) => z.string().trim().max(max, tooLong(max))
const required = (max: number, message: string) => z.string().trim().min(1, message).max(max, tooLong(max))
const optionalEmail = z.union([z.literal(""), z.string().trim().email("Enter a valid email address")])
const phone = optional(30).regex(/^$|^\+?[0-9 ()-]{7,}$/, "Include the country code, e.g. +92 300 1234567")
// "YYYY-MM-DD" (Pakistan date) or empty for none.
const dateOrEmpty = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")])

export const moneySchema = z
  .object({
    amount: z.number({ invalid_type_error: "Enter an amount" }).int("Whole numbers only").min(0).max(100_000_000),
    currency: z.enum(currencies),
  })
  .nullable()
export type Money = z.infer<typeof moneySchema>

// Editable on the lead page (the original enquiry fields stay as received).
export const leadEditSchema = z
  .object({
    name: required(100, "Enter a name"),
    email: optionalEmail,
    phone,
    business: optional(120),
    service: optional(80),
    source: z.enum(sources),
    stage: z.enum(stages),
    lostReason: optional(300),
    value: moneySchema,
    ownerId: optional(40),
    followUpOn: dateOrEmpty,
    tags: z.array(required(30, "Empty tag")).max(10, "Up to 10 tags"),
  })
  .refine((lead) => lead.email !== "" || lead.phone !== "", { message: "Add an email or a phone number", path: ["email"] })
export type LeadEdit = z.infer<typeof leadEditSchema>

// A lead added by hand (WhatsApp, referral, ...), with an optional first note.
export const manualLeadSchema = leadEditSchema.innerType().extend({ note: optional(2000) }).refine((lead) => lead.email !== "" || lead.phone !== "", {
  message: "Add an email or a phone number",
  path: ["email"],
})
export type ManualLead = z.infer<typeof manualLeadSchema>

export const noteSchema = z.object({
  type: z.enum(noteTypes),
  text: required(2000, "Write something first"),
})

export const clientSchema = z.object({
  name: required(100, "Enter the contact person's name"),
  business: optional(120),
  email: optionalEmail,
  phone,
  country: optional(60),
  currency: z.enum(currencies),
  // For invoices.
  address: optional(300),
  status: z.enum(["active", "past"]),
  notes: optional(2000),
  tags: z.array(required(30, "Empty tag")).max(10, "Up to 10 tags"),
})
export type ClientInput = z.infer<typeof clientSchema>

// Today's date in Pakistan as "YYYY-MM-DD".
export const pakistanDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(date)

export const formatMoney = (money: NonNullable<Money>) =>
  money.currency === "PKR" ? `Rs ${money.amount.toLocaleString("en-PK")}` : `$${money.amount.toLocaleString("en-US")}`

// wa.me link from a phone number ("+92 300 1234567" -> 923001234567). A local
// Pakistani number ("0300 1234567") gets the 92 country code.
export const whatsappLink = (phone: string) => {
  let digits = phone.replace(/\D/g, "")
  if (/^0\d{10}$/.test(digits)) digits = `92${digits.slice(1)}`
  digits = digits.replace(/^00/, "")
  return digits.length >= 10 ? `https://wa.me/${digits}` : null
}
