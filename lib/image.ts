/**
 * Photos taken on a phone are 2-5 MB each. Three of them in one request exceed the
 * ~6 MB limit of the API gateway in front of the worker API, which rejects the whole
 * request with "Request Too Long" before it reaches the backend - the worker is not
 * added and nothing reaches S3.
 *
 * Shrinking each photo in the browser keeps a full three-photo request at a few
 * hundred KB while staying perfectly readable for an ID document.
 */

/** Largest picture a person may choose. Anything this big is shrunk before it is sent. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
/** Largest picture actually sent. Three of these stay under the API gateway's ~6 MB cap. */
export const MAX_SENT_BYTES = 4 * 1024 * 1024

const MAX_DIMENSION = 1600
const TARGET_BYTES = 800 * 1024
const QUALITY_STEPS = [0.82, 0.7, 0.55, 0.4]

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not read this image"))
    }
    img.src = url
  })
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
}

/**
 * Returns a smaller JPEG version of the picture. If anything goes wrong (an unusual
 * format, a browser without canvas encoding) the original file is returned unchanged
 * so the upload still has a chance of working.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file
  if (file.size <= TARGET_BYTES / 2) return file

  try {
    const img = await loadImage(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)

    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    let best: Blob | null = null
    for (const quality of QUALITY_STEPS) {
      const blob = await toBlob(canvas, quality)
      if (!blob) break
      best = blob
      if (blob.size <= TARGET_BYTES) break
    }

    // Keep the original if re-encoding did not actually make it smaller.
    if (!best || best.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, "") || "photo"
    return new File([best], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() })
  } catch {
    return file
  }
}

/** Human-readable size, for upload messages. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
