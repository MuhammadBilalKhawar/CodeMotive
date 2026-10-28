import { isDbConfigured } from "@/lib/db"
import { listVersions } from "@/lib/content"
import { VersionHistory } from "@/components/admin/version-history"
import { dateTimeFormat } from "@/components/admin/ui"
import { getProjects } from "@/lib/content"
import { ProjectsEditor } from "@/components/admin/projects-editor"

export default async function AdminProjectsPage() {
  const projects = await getProjects()

  return (
    <>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-forest">Portfolio</h1>
        <p className="text-charcoal/80 mt-1">Portfolio shown on /work, the homepage and service pages. Label every project honestly.</p>
        {!isDbConfigured() && (
          <p role="alert" className="mt-4 rounded-xl bg-mint/40 border border-sage/40 px-4 py-3 text-sm text-forest">
            The database isn&apos;t connected, so changes can&apos;t be saved yet. Add MONGODB_URI to the environment variables.
          </p>
        )}
      </div>
      <ProjectsEditor initial={projects} canSave={isDbConfigured()} />
      <div className="mt-8">
        <VersionHistory contentKey="projects" versions={(await listVersions("projects")).map((v) => ({ id: v.id, savedAt: dateTimeFormat.format(v.savedAt), savedBy: v.savedBy }))} />
      </div>
    </>
  )
}
