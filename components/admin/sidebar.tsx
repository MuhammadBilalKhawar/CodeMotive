"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavGroup } from "@/lib/admin-nav"

type IconName = keyof typeof Icons

function NavIcon({ name }: { name: string }) {
  const Icon = (Icons[name as IconName] ?? Icons.Circle) as Icons.LucideIcon
  return <Icon className="w-4 h-4 shrink-0" aria-hidden />
}

// Sidebar on desktop; a menu button and slide-down panel on phones.
export function AdminSidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`))

  const links = (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-mint/60">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href) ? "bg-mint text-forest" : "text-mint/90 hover:bg-forest-800 hover:text-white",
                  )}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-60 bg-forest text-neutral border-r border-mint/10 px-3 py-5 overflow-y-auto theme-dark">
        <Link href="/admin" className="flex items-center gap-2.5 px-3 mb-8">
          <Image src="/brand/header-icon-dark-mode.svg" alt="CodeMotive" width={49} height={28} className="h-7 w-auto" />
          <span className="eyebrow text-[0.68rem] text-mint">Admin</span>
        </Link>
        {links}
      </aside>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          className="inline-flex items-center gap-2 rounded-lg border border-mint/20 px-3 py-2 text-sm font-medium text-mint"
        >
          {open ? <Icons.X className="w-4 h-4" aria-hidden /> : <Icons.Menu className="w-4 h-4" aria-hidden />}
          Menu
        </button>
        {open && (
          <div id="admin-mobile-nav" className="absolute left-0 right-0 top-full z-40 bg-forest border-b border-mint/10 px-4 py-5 shadow-2xl theme-dark">
            {links}
          </div>
        )}
      </div>
    </>
  )
}
