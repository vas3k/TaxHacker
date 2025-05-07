import fs from "fs/promises"
import path from "path"

export type AppManifest = {
  name: string
  description: string
  icon: string
}

export async function getApps(): Promise<{ id: string; manifest: AppManifest }[]> {
  const appsDir = path.join(process.cwd(), "app/(app)/apps")
  const items = await fs.readdir(appsDir, { withFileTypes: true })

  const apps = await Promise.all(
    items
      .filter((item) => item.isDirectory() && item.name !== "apps")
      .map(async (item) => {
        const manifestModule = await import(`./${item.name}/manifest`)
        return {
          id: item.name,
          manifest: manifestModule.manifest as AppManifest,
        }
      })
  )

  return apps
}
