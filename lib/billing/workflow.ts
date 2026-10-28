import { getEnv } from "@/lib/env"
import { getLead, updateLead } from "@/lib/leads"
import { addTimeline } from "@/lib/crm/timeline"
import { changeLeadStage, convertLead } from "@/lib/crm/convert"
import { sendNoticeEmail } from "@/lib/email/send"
import { money } from "@/lib/billing/schemas"
import { updateQuote, type Quote } from "@/lib/billing/store"

// What happens to the lead and client when a quote is sent, accepted or declined.

const subjectOf = (quote: Quote) => (quote.clientId ? ({ subject: "client", id: quote.clientId } as const) : quote.leadId ? ({ subject: "lead", id: quote.leadId } as const) : null)

async function note(quote: Quote, text: string, by: string) {
  const target = subjectOf(quote)
  if (target) await addTimeline(target.subject, target.id, { type: "system", text, by })
  if (quote.clientId && quote.leadId) await addTimeline("lead", quote.leadId, { type: "system", text, by })
}

export async function markQuoteSent(quote: Quote, by: string, how: string) {
  await updateQuote(quote.id, { status: "sent", sentAt: new Date() })
  await note(quote, `Quote ${quote.number} sent ${how} (${money(quote.total, quote.currency)})`, by)
  if (quote.leadId) {
    const lead = await getLead(quote.leadId)
    if (lead && (lead.stage === "new" || lead.stage === "contacted")) await changeLeadStage(lead.id, lead.stage, "quoted", by)
    // The quote's total becomes the deal value if none was set.
    if (lead && !lead.value) await updateLead(lead.id, { value: { amount: quote.total, currency: quote.currency } })
  }
}

// Accepted by the client (on the quote link) or marked accepted by the team.
// A lead becomes a client, so the invoices have someone to go to.
export async function acceptQuote(quote: Quote, by: string, byClient: boolean) {
  let clientId = quote.clientId
  if (!clientId && quote.leadId) clientId = (await convertLead(quote.leadId, byClient ? "Client" : by))?.clientId ?? ""
  await updateQuote(quote.id, { status: "accepted", decidedAt: new Date(), decidedBy: by, clientId })
  await note({ ...quote, clientId }, `Quote ${quote.number} accepted${byClient ? ` online by ${by}` : ` (marked by ${by})`}`, byClient ? "Client" : by)
  if (byClient) {
    await sendNoticeEmail({
      subject: `Quote ${quote.number} accepted by ${quote.billTo.business || quote.billTo.name}`,
      lines: [`${by} accepted "${quote.title}" (${money(quote.total, quote.currency)}).`, "Next: send the deposit invoice from the quote page."],
      url: `${getEnv().NEXT_PUBLIC_SITE_URL}/admin/quotes/${quote.id}`,
      linkLabel: "Open the quote",
    }).catch((error) => console.error("[quotes] Notice email failed", error))
  }
  return clientId
}

export async function declineQuote(quote: Quote, by: string, reason: string, byClient: boolean) {
  await updateQuote(quote.id, { status: "declined", decidedAt: new Date(), decidedBy: by, declineReason: reason })
  await note(quote, `Quote ${quote.number} declined${byClient ? ` online by ${by}` : ` (marked by ${by})`}${reason ? `: ${reason}` : ""}`, byClient ? "Client" : by)
  if (byClient) {
    await sendNoticeEmail({
      subject: `Quote ${quote.number} declined by ${quote.billTo.business || quote.billTo.name}`,
      lines: [`${by} declined "${quote.title}".`, reason ? `Reason: ${reason}` : "No reason given."],
      url: `${getEnv().NEXT_PUBLIC_SITE_URL}/admin/quotes/${quote.id}`,
      linkLabel: "Open the quote",
    }).catch((error) => console.error("[quotes] Notice email failed", error))
  }
}
