// Browser-side image upload for the admin: shrinks the image to WebP (at most
// `maxWidth` wide) and stores it through /api/admin/images.
export async function uploadImage(file: File, maxWidth = 1600) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85))
  if (!blob) throw new Error("Couldn't process the image.")

  const body = new FormData()
  body.append("file", new File([blob], "image.webp", { type: blob.type }))
  const res = await fetch("/api/admin/images", { method: "POST", body })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "Upload failed.")
  return { src: data.src as string, width, height }
}
