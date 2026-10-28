import { LOGO_MAX_BYTES, LOGO_TYPES, mockupSchema } from "@/lib/mockup-schema"
import { getIpCountry } from "@/lib/request-info"
import { checkSpam, jsonError, processInBackground, replyFor } from "@/lib/lead-pipeline"
import { templateReply } from "@/lib/ai/generateReply"
import { features } from "@/lib/env"
import { dueInWorkingDays } from "@/lib/tasks"
import { getSite } from "@/lib/cms"

export const runtime = "nodejs"


// Multipart: "data" holds the form fields as JSON, "logo" the optional file.
export async function POST(request: Request) {
  let form: FormData
  let body: Record<string, unknown>
  try {
    form = await request.formData()
    body = JSON.parse(String(form.get("data") ?? "{}"))
  } catch {
    return jsonError(400, "Invalid request.")
  }

  if (typeof body.company_website === "string" && body.company_website !== "") {
    return Response.json({ ok: true, reply: templateReply({ kind: "mockup", firstName: "there", topic: "your business", data: {} }) })
  }

  const parsed = mockupSchema.safeParse(body)
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))
    return jsonError(400, "Please check the highlighted fields.", { fields })
  }
  const req = parsed.data

  // Logo is checked on the server too: type, size, and a real file.
  const file = form.get("logo")
  let logo: { data: Uint8Array; contentType: string; filename: string } | undefined
  if (file instanceof File && file.size > 0) {
    if (!LOGO_TYPES.includes(file.type)) return jsonError(400, "Logo must be a PNG, JPG or SVG file.", { fields: { logo: "Use PNG, JPG or SVG" } })
    if (file.size > LOGO_MAX_BYTES) return jsonError(400, "Logo is larger than 4 MB.", { fields: { logo: "Max 4 MB" } })
    logo = { data: new Uint8Array(await file.arrayBuffer()), contentType: file.type, filename: file.name.replace(/[^\w.-]+/g, "_").slice(0, 80) || "logo" }
  }

  const blocked = await checkSpam(request, "mockup", req.turnstileToken)
  if (blocked) return blocked

  const firstName = req.name.split(/\s+/)[0]
  const type = req.businessType === "Other" ? req.businessTypeOther : req.businessType
  const city = req.location.split(",")[0].trim()
  const { reply, source } = await replyFor({
    kind: "mockup",
    firstName,
    topic: req.business,
    data: {
      name: req.name,
      business: req.business,
      businessType: type,
      location: req.location,
      sells: req.sells,
      customersShouldBeAbleTo: req.features,
      questionsOrNotes: req.notes.slice(0, 2000) || undefined,
    },
  })

  const fields: [string, string][] = [
    ["Name", req.name],
    ["Email", req.email],
    ["WhatsApp", req.whatsapp],
    ["Business", req.business],
    ["Business type", type],
    ["City and country", req.location],
    ["Current site / social", req.currentLink],
    ["Sells / offers", req.sells],
    ["Customers should be able to", req.features.join(", ")],
    ["Brand colours", req.brandColours],
    ["Websites they like", req.likedSites.filter(Boolean).join("\n")],
    ["Anything else", req.notes],
    ["Logo", logo ? `${logo.filename} (attached)` : "Not provided"],
    ["Outreach ref", req.ref],
  ]
  const ipCountry = getIpCountry(request)

  processInBackground({
    lead: {
      kind: "mockup",
      createdAt: new Date(),
      name: req.name,
      email: req.email,
      fields,
      reply,
      replySource: source,
      ipCountry,
      phone: req.whatsapp,
      business: req.business,
      service: `Free mockup (${type})`,
      source: "mockup",
      tags: req.ref ? [`ref-${req.ref}`.slice(0, 30)] : [],
    },
    logo,
    task: {
      kind: "mockup",
      summary: `Mockup: ${req.business} · ${type} · ${city}`,
      fields,
      reply,
      labels: ["mockup", ...(req.ref ? [`ref-${req.ref}`] : [])],
      dueDate: dueInWorkingDays((await getSite().catch(() => null))?.mockupDays ?? 3),
      steps: ["Review current site/Instagram", "Design mockup", "Send mockup", "Follow up"],
    },
    owner: {
      subject: `Mockup request: ${req.business} · ${type} · ${city}`,
      visitorEmail: req.email,
      fields,
      reply,
      replySource: source,
      ipCountry,
      logoNote: logo ? "The logo is attached to this email and saved with the lead in the admin." : undefined,
      attachments: logo ? [{ filename: logo.filename, content: Buffer.from(logo.data), contentType: logo.contentType }] : undefined,
    },
    visitor: {
      to: req.email,
      subject: `We got your mockup request, ${firstName}`,
      heading: `Thanks, ${firstName}! Your free mockup is on its way.`,
      reply,
    },
  })

  return Response.json({ ok: true, reply, emailCopy: features().email })
}
