import type { Role } from "@/lib/auth/users"

// Admin sidebar. Pages are added here as they're built; ownerOnly items are
// hidden from members (and the pages themselves also check the role).
export type NavItem = { href: string; label: string; icon: string; ownerOnly?: boolean }
export type NavGroup = { label: string; items: NavItem[] }

export const adminNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/admin/reports", label: "Reports", icon: "ChartColumn" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/leads", label: "Leads", icon: "Inbox" },
      { href: "/admin/clients", label: "Clients", icon: "Building2" },
      { href: "/admin/quotes", label: "Quotes", icon: "FileText" },
      { href: "/admin/invoices", label: "Invoices", icon: "Receipt", ownerOnly: true },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/admin/projects", label: "Projects", icon: "KanbanSquare" },
      { href: "/admin/care-plans", label: "Care plans", icon: "HeartHandshake", ownerOnly: true },
      { href: "/admin/renewals", label: "Renewals", icon: "CalendarClock" },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/website/site", label: "Site settings", icon: "Settings2" },
      { href: "/admin/website/home", label: "Homepage", icon: "House" },
      { href: "/admin/pricing", label: "Pricing", icon: "Tags" },
      { href: "/admin/website/services", label: "Services", icon: "Layers" },
      { href: "/admin/website/industries", label: "Industries", icon: "Store" },
      { href: "/admin/portfolio", label: "Portfolio", icon: "FolderKanban" },
      { href: "/admin/website/team", label: "Team", icon: "Contact" },
      { href: "/admin/website/testimonials", label: "Testimonials", icon: "Quote" },
      { href: "/admin/website/faq", label: "FAQs", icon: "CircleHelp" },
      { href: "/admin/website/guides", label: "Guides", icon: "BookOpen" },
      { href: "/admin/website/seo", label: "SEO", icon: "Search" },
      { href: "/admin/website/ai", label: "AI assistant", icon: "Bot" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings/billing", label: "Billing", icon: "Landmark", ownerOnly: true },
      { href: "/admin/settings/team", label: "Admin users", icon: "Users", ownerOnly: true },
      { href: "/admin/activity", label: "Activity log", icon: "History" },
      { href: "/admin/account", label: "My account", icon: "UserCog" },
    ],
  },
]

export const navFor = (role: Role) =>
  adminNav
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.ownerOnly || role === "owner") }))
    .filter((group) => group.items.length > 0)
