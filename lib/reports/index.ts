import { listLeads } from "@/lib/leads"
import { listInvoices, listQuotes } from "@/lib/billing/store"
import { listCarePlans } from "@/lib/delivery/store"
import { listChatQuestions } from "@/lib/chat-questions"
import { pakistanDate } from "@/lib/crm/schemas"
import { chatReport, leadReport, moneyReport, quoteReport } from "@/lib/reports/compute"

// Everything the dashboard and reports need, for a period of `days` ending now.
// Money is only loaded for owners.
export async function loadReport(days: number, { money }: { money: boolean }) {
  const now = new Date()
  const today = pakistanDate(now)
  const [leads, quotes, invoices, plans, questions] = await Promise.all([
    listLeads({}, 5000),
    listQuotes(),
    money ? listInvoices() : Promise.resolve([]),
    money ? listCarePlans() : Promise.resolve([]),
    listChatQuestions(new Date(now.getTime() - days * 86_400_000)),
  ])
  return {
    today,
    days,
    leads: leadReport(leads, now, days),
    quotes: quoteReport(quotes, now, days),
    money: money ? moneyReport(invoices, plans, today, days) : null,
    chat: chatReport(questions),
  }
}

export const reportRanges = [
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
  { days: 365, label: "Last 12 months" },
] as const
