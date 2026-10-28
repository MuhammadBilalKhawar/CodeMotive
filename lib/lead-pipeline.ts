import { after } from "next/server"
import { getPricing, getProjects } from "@/lib/content"
import { getAiSettings, getFaqs, getServices, getSite, getTeam } from "@/lib/cms"
import { allowedPrices, buildCompanyFacts } from "@/lib/ai/knowledge"
import { generateReply, templateReply, type ReplyContext, type ReplyRequest } from "@/lib/ai/generateReply"
import { verifyTurnstile } from "@/lib/turnstile"
import { isRateLimited } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-info"
import { saveLead, saveUpload, updateLead, type DeliveryStatus, type LeadDoc } from "@/lib/leads"
import { createLeadTask, type LeadTask } from "@/lib/tasks"
import { sendOwnerEmail, sendVisitorEmail } from "@/lib/email/send"

// Steps shared by /api/contact and /api/free-mockup.

const RATE_LIMIT = { limit: 3, windowMs: 10 * 60 * 1000 }

export const jsonError = (status: number, error: string, extra?: object) => Response.json({ ok: false, error, ...extra }, { status })

// Turnstile (when configured) and 3 submissions per IP per 10 minutes.
// Returns a response to send back if the request should stop here.
export async function checkSpam(request: Request, scope: string, turnstileToken: string | undefined) {
  const ip = getClientIp(request)
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return jsonError(400, "We couldn't verify you're human. Please refresh the page and try again.")
  }
  if (await isRateLimited(`${scope}:${ip}`, RATE_LIMIT)) {
    return jsonError(429, "You've sent several messages in a short time. Please wait a few minutes, or message us on WhatsApp.")
  }
  return null
}

export function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code
  } catch {
    return code
  }
}

// Company facts and allowed prices for the AI, from the live content; null if it can't be loaded.
export async function loadReplyContext(): Promise<ReplyContext | null> {
  try {
    const [pricing, projects, site, team, services, faqs, ai] = await Promise.all([
      getPricing(),
      getProjects(),
      getSite(),
      getTeam(),
      getServices(),
      getFaqs(),
      getAiSettings(),
    ])
    return {
      facts: buildCompanyFacts({ pricing, projects, site, team, services, faqs, ai }),
      allowedPrices: allowedPrices(pricing),
      site: { whatsappUrl: site.whatsappUrl, mockupDays: site.mockupDays },
    }
  } catch (error) {
    console.error("[ai] Couldn't load content for the AI reply", error)
    return null
  }
}

// The AI reply, or the template if the content can't be loaded.
export async function replyFor(request: ReplyRequest) {
  const context = await loadReplyContext()
  if (!context) return { reply: templateReply(request), source: "template" as const }
  return generateReply(request, context)
}

type BackgroundJob = {
  lead: LeadDoc
  logo?: { data: Uint8Array; contentType: string; filename: string }
  task: LeadTask
  owner: Omit<Parameters<typeof sendOwnerEmail>[0], "taskUrl">
  visitor: Parameters<typeof sendVisitorEmail>[0]
}

const statusOf = (result: PromiseSettledResult<DeliveryStatus>): DeliveryStatus =>
  result.status === "fulfilled" ? result.value : "failed"

// Runs after the response is sent, so the visitor sees their reply instantly.
// Failures are logged and recorded on the lead, never shown to the visitor.
export function processInBackground({ lead, logo, task, owner, visitor }: BackgroundJob) {
  after(async () => {
    let leadId: string | null = null
    try {
      const logoId = logo ? ((await saveUpload(logo)) ?? undefined) : undefined
      leadId = await saveLead({ ...lead, logoId })
    } catch (error) {
      console.error("[lead] Saving the lead failed", error)
    }

    let taskUrl: string | undefined
    try {
      taskUrl = (await createLeadTask(task)).url
    } catch (error) {
      console.error("[lead] Creating the task failed", error)
    }

    const [ownerResult, visitorResult] = await Promise.allSettled([sendOwnerEmail({ ...owner, taskUrl }), sendVisitorEmail(visitor)])
    for (const result of [ownerResult, visitorResult]) {
      if (result.status === "rejected") console.error("[lead] Email failed", result.reason)
    }

    try {
      await updateLead(leadId, { taskUrl, ownerEmail: statusOf(ownerResult), visitorEmail: statusOf(visitorResult) })
    } catch (error) {
      console.error("[lead] Updating the lead failed", error)
    }
  })
}
