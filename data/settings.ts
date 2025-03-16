import { prisma } from "@/lib/db"
import { cache } from "react"

export type SettingsMap = Record<string, string>

export const getSettings = cache(async (): Promise<SettingsMap> => {
  const settings = await prisma.setting.findMany()
  return settings.reduce((acc, setting) => {
    acc[setting.code] = setting.value || ""
    return acc
  }, {} as SettingsMap)
})

export const updateSettings = cache(async (code: string, value?: any) => {
  console.log("updateSettings", code, value)
  return await prisma.setting.upsert({
    where: { code },
    update: { value },
    create: {
      code,
      value,
      name: code,
    },
  })
})
