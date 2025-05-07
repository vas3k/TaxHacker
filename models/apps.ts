import { prisma } from "@/lib/db"
import { User } from "@/prisma/client"

export const getAppData = async (user: User, app: string) => {
  const appData = await prisma.appData.findUnique({
    where: { userId_app: { userId: user.id, app } },
  })

  return appData?.data
}

export const setAppData = async (user: User, app: string, data: any) => {
  await prisma.appData.upsert({
    where: { userId_app: { userId: user.id, app } },
    update: { data },
    create: { userId: user.id, app, data },
  })
}
