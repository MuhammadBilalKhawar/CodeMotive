import { ObjectId, type Binary } from "mongodb"
import { getDb, isDbConfigured } from "@/lib/db"

type ImageDoc = { contentType: string; data: Binary }

// Serves uploaded project screenshots. Each upload gets a new id, so the
// response can be cached forever by browsers and the CDN.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isDbConfigured() || !ObjectId.isValid(id)) return new Response("Not found", { status: 404 })

  const image = await (await getDb()).collection<ImageDoc>("images").findOne({ _id: new ObjectId(id) })
  if (!image) return new Response("Not found", { status: 404 })

  return new Response(new Uint8Array(image.data.buffer), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
