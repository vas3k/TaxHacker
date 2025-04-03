import { resizeImage } from "@/lib/previews/images"
import { pdfToImages } from "@/lib/previews/pdf"
import { User } from "@prisma/client"

export async function generateFilePreviews(
  user: User,
  filePath: string,
  mimetype: string
): Promise<{ contentType: string; previews: string[] }> {
  if (mimetype === "application/pdf") {
    const { contentType, pages } = await pdfToImages(user, filePath)
    return { contentType, previews: pages }
  } else if (mimetype.startsWith("image/")) {
    const { contentType, resizedPath } = await resizeImage(user, filePath)
    return { contentType, previews: [resizedPath] }
  } else {
    return { contentType: mimetype, previews: [filePath] }
  }
}
