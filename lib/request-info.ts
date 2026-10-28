// Client details from the host's proxy headers (Vercel, or Cloudflare in front).
export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  )
}

export function getIpCountry(request: Request) {
  return request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? null
}
