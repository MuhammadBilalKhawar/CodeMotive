// Returns the visitor's country (ISO code) from the host's geo header, so
// marketing pages can stay static and pick PKR/USD on the client.
export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry")
  return Response.json({ country }, { headers: { "Cache-Control": "private, no-store" } })
}
