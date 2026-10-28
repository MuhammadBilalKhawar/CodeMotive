import { ObjectId, type Binary } from "mongodb"
import { getCurrentUser } from "@/lib/auth/current"
import { getDb, isDbConfigured } from "@/lib/db"

type UploadDoc = { contentType: string; filename: string; data: Binary }

// Files visitors uploaded (mockup logos). Admin only, and sandboxed so an
// uploaded SVG can't run scripts.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) {
    return new Response("Not signed in", { status: 401 })
  }
  const { id } = await params
  if (!isDbConfigured() || !ObjectId.isValid(id)) return new Response("Not found", { status: 404 })

  const file = await (await getDb()).collection<UploadDoc>("uploads").findOne({ _id: new ObjectId(id) })
  if (!file) return new Response("Not found", { status: 404 })

  return new Response(new Uint8Array(file.data.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `${file.contentType === "image/svg+xml" ? "attachment" : "inline"}; filename="${file.filename}"`,
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  })
}
