"use server"

import { fileExists, getUserPreviewsDirectory } from "@/lib/files"
import { User } from "@/prisma/client"
import fs from "fs/promises"
import path from "path"
import sharp from "sharp"

const MAX_WIDTH = 1800
const MAX_HEIGHT = 1800
const QUALITY = 90

export async function resizeImage(
  user: User,
  origFilePath: string,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT
): Promise<{ contentType: string; resizedPath: string }> {
  try {
    const userPreviewsDirectory = await getUserPreviewsDirectory(user)
    await fs.mkdir(userPreviewsDirectory, { recursive: true })

    const basename = path.basename(origFilePath, path.extname(origFilePath))
    const outputPath = path.join(userPreviewsDirectory, `${basename}.webp`)

    if (await fileExists(outputPath)) {
      const metadata = await sharp(outputPath).metadata()
      return {
        contentType: `image/${metadata.format}`,
        resizedPath: outputPath,
      }
    }

    await sharp(origFilePath)
      .rotate()
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toFile(outputPath)

    return {
      contentType: "image/webp",
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
