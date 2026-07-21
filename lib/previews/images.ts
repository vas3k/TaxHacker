"use server"

import { fileExists, getUserPreviewsDirectory, safePathJoin } from "@/lib/files"
import { User } from "@/prisma/client"
import fs from "fs/promises"
import path from "path"
import sharp from "sharp"
import config from "../config"
import { DEFAULT_PREVIEW_FORMAT, PreviewFormat, previewContentType, previewExtension } from "./format"

export async function resizeImage(
  user: User,
  origFilePath: string,
  maxWidth: number = config.upload.images.maxWidth,
  maxHeight: number = config.upload.images.maxHeight,
  quality: number = config.upload.images.quality,
  format: PreviewFormat = DEFAULT_PREVIEW_FORMAT
): Promise<{ contentType: string; resizedPath: string }> {
  try {
    const userPreviewsDirectory = getUserPreviewsDirectory(user)
    await fs.mkdir(userPreviewsDirectory, { recursive: true })

    const basename = path.basename(origFilePath, path.extname(origFilePath))
    const extension = previewExtension(format)
    const contentType = previewContentType(format)
    const outputPath = safePathJoin(userPreviewsDirectory, `${basename}.${extension}`)

    if (await fileExists(outputPath)) {
      const metadata = await sharp(outputPath).metadata()
      return {
        contentType: `image/${metadata.format}`,
        resizedPath: outputPath,
      }
    }

    const sharpInstance = sharp(origFilePath)
      .rotate()
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })

    switch (format) {
      case "png":
        await sharpInstance.png().toFile(outputPath)
        break
      case "jpeg":
        await sharpInstance.jpeg({ quality }).toFile(outputPath)
        break
      case "webp":
      default:
        await sharpInstance.webp({ quality }).toFile(outputPath)
        break
    }

    return {
      contentType,
      resizedPath: outputPath,
    }
  } catch (error) {
    console.error("Error resizing image:", error)
    return {
      contentType: "image/unknown",
      resizedPath: origFilePath,
    }
  }
}
