import { getClient } from "@/lib/crm/clients"
import { addTimeline } from "@/lib/crm/timeline"
import { pakistanDate } from "@/lib/crm/schemas"
import { addDays, money } from "@/lib/billing/schemas"
import { createInvoice, getBillingSettings, getInvoice, updateInvoice } from "@/lib/billing/store"
import { emailInvoice } from "@/lib/billing/send"
import { claimCarePlanPeriod, recordCarePlanInvoice, type CarePlan } from "@/lib/delivery/store"
import { nextPeriod, periodLabel } from "@/lib/delivery/schemas"

// Creates the invoice for a care plan's current period and moves the plan on.
// Used by the daily cron (when due) and by "Invoice now".
export async function invoiceCarePlan(plan: CarePlan, by: string) {
  const period = plan.nextInvoiceOn
  // Claim the period first: if another run already did, stop here.
  if (!(await claimCarePlanPeriod(plan.id, period, nextPeriod(period, plan.interval)))) return null

  const [client, settings] = await Promise.all([getClient(plan.clientId), getBillingSettings()])
  const today = pakistanDate()
  const invoiceId = await createInvoice(
    {
      clientId: plan.clientId,
      leadId: "",
      billTo: client ? { name: client.name, business: client.business, email: client.email, address: client.address } : { name: "Client", business: "", email: "", address: "" },
      currency: plan.currency,
      items: [{ description: `${plan.name}: ${periodLabel(period, plan.interval)}`.slice(0, 120), details: plan.description, quantity: 1, unitPrice: plan.amount }],
      discount: 0,
      notes: "",
      issueDate: today,
      dueDate: addDays(today, settings.invoiceDueDays),
    },
    by,
  )
  await recordCarePlanInvoice(plan.id, invoiceId)

  let emailed = false
  if (plan.invoiceMode === "send" && client?.email) {
    const invoice = await getInvoice(invoiceId)
    try {
      if (invoice && (await emailInvoice({ ...invoice, status: "sent" }, "invoice")) === "sent") {
        await updateInvoice(invoiceId, { status: "sent", sentAt: new Date() })
        emailed = true
      }
    } catch (error) {
      // The draft stays for the team to send; the digest mentions it.
      console.error(`[care plans] Emailing the invoice for ${plan.name} failed`, error)
    }
  }
  await addTimeline("client", plan.clientId, {
    type: "system",
    text: `${plan.name} invoice for ${periodLabel(period, plan.interval)} created (${money(plan.amount, plan.currency)})${emailed ? " and emailed" : ", draft to send"}`,
    by,
  })
  return { invoiceId, emailed }
}
