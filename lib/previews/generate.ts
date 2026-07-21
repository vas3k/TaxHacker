import config from "@/lib/config"
import { resizeImage } from "@/lib/previews/images"
import { pdfToImages } from "@/lib/previews/pdf"
import { User } from "@/prisma/client"
import { DEFAULT_PREVIEW_FORMAT, PreviewFormat } from "./format"

export async function generateFilePreviews(
  user: User,
  filePath: string,
  mimetype: string,
  format: PreviewFormat = DEFAULT_PREVIEW_FORMAT
): Promise<{ contentType: string; previews: string[] }> {
  if (mimetype === "application/pdf") {
    const { contentType, pages } = await pdfToImages(user, filePath, format)
    return { contentType, previews: pages }
  } else if (mimetype.startsWith("image/")) {
    const { contentType, resizedPath } = await resizeImage(
      user,
      filePath,
      config.upload.images.maxWidth,
      config.upload.images.maxHeight,
      config.upload.images.quality,
      format
    )
    return { contentType, previews: [resizedPath] }
  } else {
    return { contentType: mimetype, previews: [filePath] }
  }
}
