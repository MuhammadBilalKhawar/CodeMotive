import { getBillingSettings, getQuoteByToken } from "@/lib/billing/store"
import { quotePdf } from "@/lib/billing/pdf"
import { getCurrentUser } from "@/lib/auth/current"

export const runtime = "nodejs"

// The quote as a PDF. Drafts are only available to signed-in admins (preview).
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const quote = await getQuoteByToken((await params).token)
  if (!quote) return new Response("Not found", { status: 404 })
  if (quote.status === "draft" && !(await getCurrentUser())) return new Response("Not found", { status: 404 })
  const pdf = await quotePdf(quote, await getBillingSettings())
  const download = new URL(request.url).searchParams.has("download")
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${quote.number}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  })
}
