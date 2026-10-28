import { contactSchema } from "@/lib/contact-schema"
import { getIpCountry } from "@/lib/request-info"
import { checkSpam, countryName, jsonError, processInBackground, replyFor } from "@/lib/lead-pipeline"
import { templateReply } from "@/lib/ai/generateReply"
import { features } from "@/lib/env"
import { dueInDays } from "@/lib/tasks"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError(400, "Invalid request.")
  }

  // Honeypot filled in: look successful, do nothing.
  if (typeof body.company_website === "string" && body.company_website !== "") {
    return Response.json({ ok: true, reply: templateReply({ kind: "contact", firstName: "there", topic: "your project", data: {} }) })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))
    return jsonError(400, "Please check the highlighted fields.", { fields })
  }
  const lead = parsed.data

  const blocked = await checkSpam(request, "contact", lead.turnstileToken)
  if (blocked) return blocked

  const firstName = lead.name.split(/\s+/)[0]
  const country = countryName(lead.country)
  const { reply, source } = await replyFor({
    kind: "contact",
    firstName,
    topic: lead.service === "Not sure" ? "your project" : lead.service,
    data: {
      name: lead.name,
      business: lead.business || undefined,
      country,
      service: lead.service,
      package: lead.package,
      budget: lead.budget || undefined,
      message: lead.message.slice(0, 2000),
    },
  })

  const fields: [string, string][] = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["WhatsApp / phone", lead.phone],
    ["Business", lead.business],
    ["Country", country],
    ["Service", lead.service],
    ["Package", lead.package ?? ""],
    ["Budget", lead.budget],
    ["Message", lead.message],
  ]
  const ipCountry = getIpCountry(request)
  const summary = `${lead.name} · ${lead.service} · ${country}`

  processInBackground({
    lead: {
      kind: "contact",
      createdAt: new Date(),
      name: lead.name,
      email: lead.email,
      fields,
      reply,
      replySource: source,
      ipCountry,
      phone: lead.phone,
      business: lead.business,
      service: lead.service,
      source: "website",
    },
    task: { kind: "contact", summary, fields, reply, labels: ["lead", lead.service], dueDate: dueInDays(1) },
    owner: { subject: `New lead: ${summary}`, visitorEmail: lead.email, fields, reply, replySource: source, ipCountry },
    visitor: { to: lead.email, subject: `We got your message, ${firstName}`, heading: `Thanks, ${firstName}!`, reply },
  })

  return Response.json({ ok: true, reply, emailCopy: features().email })
}
