import { Binary } from "mongodb"
import { getCurrentUser } from "@/lib/auth/current"
import { getDb, isDbConfigured } from "@/lib/db"

// Project screenshot upload. The admin resizes images to WebP in the browser
// first, so files are small; they're stored in MongoDB and served by
// /api/images/[id]. SVG is refused (it can carry scripts).
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 3 * 1024 * 1024

export async function POST(request: Request) {
  if (!(await getCurrentUser())) {
    return Response.json({ error: "Not signed in" }, { status: 401 })
  }
  if (!isDbConfigured()) {
    return Response.json({ error: "The database isn't connected." }, { status: 503 })
  }

  const file = (await request.formData()).get("file")
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return Response.json({ error: "Use a PNG, JPG or WebP image." }, { status: 400 })
  if (file.size > MAX_BYTES) return Response.json({ error: "Image is larger than 3 MB." }, { status: 400 })

  try {
    const result = await (await getDb()).collection("images").insertOne({
      contentType: file.type,
      data: new Binary(new Uint8Array(await file.arrayBuffer())),
      size: file.size,
      createdAt: new Date(),
    })
    return Response.json({ src: `/api/images/${result.insertedId.toString()}` })
  } catch (error) {
    console.error("Image upload failed", error)
    return Response.json({ error: "Couldn't save the image. Please try again." }, { status: 500 })
  }
}
