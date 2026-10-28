import { getDb, isDbConfigured } from "@/lib/db"
import type { NoteType } from "@/lib/crm/schemas"

// What happened with a lead, client or project: notes, calls and WhatsApps
// logged by the team, plus automatic entries (stage changes, conversions...).

export type TimelineType = NoteType | "stage" | "system"

type TimelineDoc = {
  subject: "lead" | "client" | "project"
  subjectId: string
  at: Date
  type: TimelineType
  text: string
  by: string
}

export type TimelineEntry = Omit<TimelineDoc, "subject" | "subjectId"> & { id: string }

const timeline = async () => (await getDb()).collection<TimelineDoc>("timeline")

export async function addTimeline(subject: TimelineDoc["subject"], subjectId: string, entry: { type: TimelineType; text: string; by: string }) {
  if (!isDbConfigured()) return
  await (await timeline()).insertOne({ subject, subjectId, at: new Date(), ...entry })
}

export async function listTimeline(subject: TimelineDoc["subject"], subjectId: string): Promise<TimelineEntry[]> {
  if (!isDbConfigured()) return []
  const docs = await (await timeline()).find({ subject, subjectId }).sort({ at: -1 }).limit(300).toArray()
  return docs.map(({ _id, subject: _s, subjectId: _id2, ...doc }) => ({ id: _id.toString(), ...doc }))
}

// Last contact per lead (call, WhatsApp, email or meeting), for the list view.
export async function lastContactByLead(leadIds: string[]) {
  if (!isDbConfigured() || leadIds.length === 0) return new Map<string, Date>()
  const rows = await (await timeline())
    .aggregate<{ _id: string; at: Date }>([
      { $match: { subject: "lead", subjectId: { $in: leadIds }, type: { $in: ["call", "whatsapp", "email", "meeting"] } } },
      { $group: { _id: "$subjectId", at: { $max: "$at" } } },
    ])
    .toArray()
  return new Map(rows.map((r) => [r._id, r.at]))
}
