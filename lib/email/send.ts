import { Resend } from "resend"
import { getEnv } from "@/lib/env"
import type { DeliveryStatus } from "@/lib/leads"
import { DigestEmail, DocumentEmail, NoticeEmail, OwnerLeadEmail, VisitorReplyEmail, type DigestSection } from "@/lib/email/templates"
import { getSite } from "@/lib/cms"
import { siteInfo } from "@/lib/cms/site-info"
import { defaultSite } from "@/lib/cms/defaults"

type Attachment = { filename: string; content: Buffer; contentType?: string }

let client: Resend | null = null
const resend = () => {
  const key = getEnv().RESEND_API_KEY
  if (!key) return null
  client ??= new Resend(key)
  return client
}

const receivedAt = () =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date())

// Lead details to Bilal's inbox. Reply-To is the visitor, so "Reply" answers them.
export async function sendOwnerEmail(input: {
  subject: string
  visitorEmail: string
  fields: [string, string][]
  reply: string
  replySource: string
  ipCountry: string | null
  taskUrl?: string
  logoNote?: string
  attachments?: Attachment[]
}): Promise<DeliveryStatus> {
  const api = resend()
  if (!api) return "skipped"
  const env = getEnv()
  const { error } = await api.emails.send({
    from: env.RESEND_FROM,
    to: env.CONTACT_TO_EMAIL,
    replyTo: input.visitorEmail,
    subject: input.subject,
    react: OwnerLeadEmail({
      title: input.subject,
      fields: input.fields,
      reply: input.reply,
      replySource: input.replySource,
      ipCountry: input.ipCountry,
      receivedAt: receivedAt(),
      taskUrl: input.taskUrl,
      logoNote: input.logoNote,
    }),
    attachments: input.attachments,
  })
  if (error) throw new Error(`Resend (owner): ${error.message}`)
  return "sent"
}

// Confirmation to the visitor with the same reply they saw. Reply-To is our inbox.
export async function sendVisitorEmail(input: { to: string; subject: string; heading: string; reply: string }): Promise<DeliveryStatus> {
  const api = resend()
  if (!api) return "skipped"
  const env = getEnv()
  // The signature uses the saved site settings; the defaults if they can't be read.
  const site = await getSite().catch(() => siteInfo(defaultSite))
  const { error } = await api.emails.send({
    from: env.RESEND_VISITOR_FROM,
    to: input.to,
    replyTo: env.CONTACT_TO_EMAIL,
    subject: input.subject,
    react: VisitorReplyEmail({ heading: input.heading, reply: input.reply, site }),
  })
  if (error) throw new Error(`Resend (visitor): ${error.message}`)
  return "sent"
}

// Daily follow-up digest to the team inbox.
export async function sendDigestEmail(input: { date: string; sections: DigestSection[]; adminUrl: string }): Promise<DeliveryStatus> {
  const api = resend()
  if (!api) return "skipped"
  const env = getEnv()
  const summary = input.sections.filter((s) => s.rows.length).map((s) => `${s.rows.length} ${s.title.toLowerCase()}`)
  const { error } = await api.emails.send({
    from: env.RESEND_FROM,
    to: env.CONTACT_TO_EMAIL,
    subject: `Today: ${summary.join(", ")}`,
    react: DigestEmail(input),
  })
  if (error) throw new Error(`Resend (digest): ${error.message}`)
  return "sent"
}

// A quote, invoice or reminder to a client, with the PDF attached. Reply-To is our inbox.
export async function sendDocumentEmail(input: {
  to: string
  subject: string
  heading: string
  paragraphs: string[]
  summary: [string, string][]
  buttonLabel: string
  url: string
  attachment: { filename: string; content: Buffer }
}): Promise<DeliveryStatus> {
  const api = resend()
  if (!api) return "skipped"
  const env = getEnv()
  const site = await getSite().catch(() => siteInfo(defaultSite))
  const { attachment, to, subject, ...props } = input
  const { error } = await api.emails.send({
    from: env.RESEND_VISITOR_FROM,
    to,
    replyTo: env.CONTACT_TO_EMAIL,
    subject,
    react: DocumentEmail({ ...props, site }),
    attachments: [{ filename: attachment.filename, content: attachment.content, contentType: "application/pdf" }],
  })
  if (error) throw new Error(`Resend (document): ${error.message}`)
  return "sent"
}

// Notice to the team inbox, e.g. "Quote Q-2026-004 accepted".
export async function sendNoticeEmail(input: { subject: string; lines: string[]; url: string; linkLabel: string }): Promise<DeliveryStatus> {
  const api = resend()
  if (!api) return "skipped"
  const env = getEnv()
  const { error } = await api.emails.send({
    from: env.RESEND_FROM,
    to: env.CONTACT_TO_EMAIL,
    subject: input.subject,
    react: NoticeEmail({ heading: input.subject, lines: input.lines, url: input.url, linkLabel: input.linkLabel }),
  })
  if (error) throw new Error(`Resend (notice): ${error.message}`)
  return "sent"
}
