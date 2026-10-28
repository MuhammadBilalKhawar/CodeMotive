import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifyToken } from "@/lib/auth/session"

// Guards the admin pages and admin API by checking the session signature.
// Pages and actions check the account itself (active, not signed out) again.
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/login/verify", "/admin/setup"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const signedIn = Boolean(await verifyToken(request.cookies.get(SESSION_COOKIE)?.value))

  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    if (signedIn && pathname !== "/admin/setup") return NextResponse.redirect(new URL("/admin", request.url))
    return withNoIndex(NextResponse.next())
  }

  if (signedIn) return withNoIndex(NextResponse.next())

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const loginUrl = new URL("/admin/login", request.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

function withNoIndex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
