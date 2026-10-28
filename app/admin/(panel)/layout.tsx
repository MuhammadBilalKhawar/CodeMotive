import Image from "next/image"
import Link from "next/link"
import { ExternalLink, LogOut } from "lucide-react"
import { logout } from "@/app/admin/actions/auth"
import { requireUser } from "@/lib/auth/current"
import { navFor } from "@/lib/admin-nav"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="min-h-screen">
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 bg-forest lg:bg-neutral border-b border-mint/10 lg:border-sage/20">
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <Link href="/admin" className="lg:hidden">
              <Image src="/brand/header-icon-dark-mode.svg" alt="CodeMotive admin" width={49} height={28} className="h-7 w-auto" />
            </Link>
            {/* Fixed sidebar on desktop; menu button + panel on phones. */}
            <AdminSidebar groups={navFor(user.role)} />
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-mint lg:text-charcoal/80">
                {user.name} <span className="text-mint/70 lg:text-sage-600">· {user.role === "owner" ? "Owner" : "Team member"}</span>
              </span>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-mint lg:text-forest hover:bg-forest-800 lg:hover:bg-white"
              >
                View site
                <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-mint/20 lg:border-sage/40 px-3 py-2 font-medium text-mint lg:text-forest hover:bg-forest-800 lg:hover:bg-white"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">{children}</main>
      </div>
    </div>
  )
}
