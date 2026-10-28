import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo"

// Visible breadcrumb trail (on dark page heroes) plus BreadcrumbList JSON-LD.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const crumbs = [{ name: "Home", path: "/" }, ...items]
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-mint/85">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1
            return (
              <li key={crumb.path} className="inline-flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="text-white">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.path} className="hover:text-white underline-offset-4 hover:underline">
                      {crumb.name}
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-sage" aria-hidden />
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
