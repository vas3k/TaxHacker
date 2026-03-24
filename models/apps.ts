import { prisma } from "@/lib/db"
import { User } from "@/prisma/client"

// Check if using SQLite (stores JSON as string) vs PostgreSQL (native JSON)
const isSQLite = process.env.DATABASE_PROVIDER === "sqlite" ||
  process.env.DATABASE_URL?.startsWith("file:")

export const getAppData = async <T = unknown>(user: User, app: string): Promise<T | null> => {
  const appData = await prisma.appData.findUnique({
    where: { userId_app: { userId: user.id, app } },
  })

  if (!appData?.data) return null

  // SQLite stores JSON as string, PostgreSQL returns parsed object
  if (isSQLite && typeof appData.data === "string") {
    try {
      return JSON.parse(appData.data) as T
    } catch {
      return null
    }
  }

  return appData.data as T
}

export const setAppData = async (user: User, app: string, data: any) => {
  // SQLite needs JSON stringified, PostgreSQL accepts objects directly
  const dataToStore = isSQLite ? JSON.stringify(data) : data

  await prisma.appData.upsert({
    where: { userId_app: { userId: user.id, app } },
    update: { data: dataToStore },
    create: { userId: user.id, app, data: dataToStore },
  })
}
