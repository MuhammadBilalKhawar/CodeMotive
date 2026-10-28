import { getBillingSettings, getInvoiceByToken } from "@/lib/billing/store"
import { invoicePdf } from "@/lib/billing/pdf"
import { getCurrentUser } from "@/lib/auth/current"

export const runtime = "nodejs"

// The invoice as a PDF. Drafts are only available to signed-in admins (preview).
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const invoice = await getInvoiceByToken((await params).token)
  if (!invoice) return new Response("Not found", { status: 404 })
  if (invoice.status === "draft" && !(await getCurrentUser())) return new Response("Not found", { status: 404 })
  const pdf = await invoicePdf(invoice, await getBillingSettings())
  const download = new URL(request.url).searchParams.has("download")
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${invoice.number}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  })
}
