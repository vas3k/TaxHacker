"use server"

import { fileExists, getUserPreviewsDirectory } from "@/lib/files"
import { User } from "@/prisma/client"
import fs from "fs/promises"
import path from "path"
import { fromPath } from "pdf2pic"

const MAX_PAGES = 10
const DPI = 150
const QUALITY = 90
const MAX_WIDTH = 1500
const MAX_HEIGHT = 1500

export async function pdfToImages(user: User, origFilePath: string): Promise<{ contentType: string; pages: string[] }> {
  const userPreviewsDirectory = await getUserPreviewsDirectory(user)
  await fs.mkdir(userPreviewsDirectory, { recursive: true })

  const basename = path.basename(origFilePath, path.extname(origFilePath))
  // Check if converted pages already exist
  const existingPages: string[] = []
  for (let i = 1; i <= MAX_PAGES; i++) {
    const convertedFilePath = path.join(userPreviewsDirectory, `${basename}.${i}.webp`)
    if (await fileExists(convertedFilePath)) {
      existingPages.push(convertedFilePath)
    } else {
      break
    }
  }

  if (existingPages.length > 0) {
    return { contentType: "image/webp", pages: existingPages }
  }

  // If not — convert the file as store in previews folder
  const pdf2picOptions = {
    density: DPI,
    saveFilename: basename,
    savePath: userPreviewsDirectory,
    format: "webp",
    quality: QUALITY,
    width: MAX_WIDTH,
    height: MAX_HEIGHT,
    preserveAspectRatio: true,
  }

  try {
    const convert = fromPath(origFilePath, pdf2picOptions)
    const results = await convert.bulk(-1, { responseType: "image" }) // TODO: respect MAX_PAGES here too
    const paths = results.filter((result) => result && result.path).map((result) => result.path) as string[]
    return {
      contentType: "image/webp",
      pages: paths,
    }
  } catch (error) {
    console.error("Error converting PDF to image:", error)
    throw error
  }
}
