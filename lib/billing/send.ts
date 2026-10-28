import { getEnv } from "@/lib/env"
import { sendDocumentEmail } from "@/lib/email/send"
import { getBillingSettings, type Invoice, type Quote } from "@/lib/billing/store"
import { invoicePdf, quotePdf } from "@/lib/billing/pdf"
import { longDate, money, splitTotal } from "@/lib/billing/schemas"

// Emails to clients with the PDF attached and a link to view it online.

export const quoteUrl = (quote: Pick<Quote, "token">) => `${getEnv().NEXT_PUBLIC_SITE_URL}/quote/${quote.token}`
export const invoiceUrl = (invoice: Pick<Invoice, "token">) => `${getEnv().NEXT_PUBLIC_SITE_URL}/invoice/${invoice.token}`

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there"

export async function emailQuote(quote: Quote) {
  const settings = await getBillingSettings()
  const parts = splitTotal(quote.total, quote.schedule)
  return sendDocumentEmail({
    to: quote.billTo.email,
    subject: `Your quote from ${settings.businessName}: ${quote.title}`,
    heading: `Your quote, ${firstName(quote.billTo.name)}`,
    paragraphs: [
      `Thanks for talking to us. Here's our quote for ${quote.title.toLowerCase().startsWith("quote") ? "your project" : quote.title}. The PDF is attached, and you can view and accept it online.`,
      "Any questions or changes, just reply to this email.",
    ],
    summary: [
      ["Quote", quote.number],
      ["Total", money(quote.total, quote.currency)],
      ...parts.map((p): [string, string] => [`${p.label} (${p.percent}%)`, money(p.amount, quote.currency)]),
      ["Valid until", longDate(quote.validUntil)],
    ],
    buttonLabel: "View and accept the quote",
    url: quoteUrl(quote),
    attachment: { filename: `${quote.number}.pdf`, content: await quotePdf(quote, settings) },
  })
}

export async function emailInvoice(invoice: Invoice, kind: "invoice" | "reminder") {
  const settings = await getBillingSettings()
  const reminder = kind === "reminder"
  const late = invoice.state === "overdue"
  return sendDocumentEmail({
    to: invoice.billTo.email,
    subject: reminder
      ? `Reminder: invoice ${invoice.number} ${late ? "is overdue" : `is due ${longDate(invoice.dueDate)}`}`
      : `Invoice ${invoice.number} from ${settings.businessName}`,
    heading: reminder ? `A quick reminder, ${firstName(invoice.billTo.name)}` : `Your invoice, ${firstName(invoice.billTo.name)}`,
    paragraphs: reminder
      ? [
          `Invoice ${invoice.number} has ${money(invoice.balance, invoice.currency)} outstanding${late ? `; it was due on ${longDate(invoice.dueDate)}` : ""}. The payment details are in the attached PDF and on the link below.`,
          "If you've already paid, thank you, and please reply with the payment reference so we can match it.",
        ]
      : [`Here's invoice ${invoice.number}. The PDF is attached, and the payment details are on the link below.`, "Any questions, just reply to this email."],
    summary: [
      ["Invoice", invoice.number],
      ["Amount due", money(invoice.balance, invoice.currency)],
      ["Due date", longDate(invoice.dueDate)],
    ],
    buttonLabel: "View the invoice",
    url: invoiceUrl(invoice),
    attachment: { filename: `${invoice.number}.pdf`, content: await invoicePdf(invoice, settings) },
  })
}
