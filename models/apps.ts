import { prisma } from "@/lib/db"
import { User } from "@/prisma/client"

export const getAppData = async <T = unknown>(user: User, app: string): Promise<T | null> => {
  const appData = await prisma.appData.findUnique({
    where: { userId_app: { userId: user.id, app } },
  })

  if (!appData?.data) return null

  return appData.data as T
}

export const setAppData = async (user: User, app: string, data: any) => {
  await prisma.appData.upsert({
    where: { userId_app: { userId: user.id, app } },
    update: { data },
    create: { userId: user.id, app, data },
  })
}
