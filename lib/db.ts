import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["query", "info", "warn", "error"] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export const DATABASE_FILE = process.env.DATABASE_URL?.split(":").pop() || "db.sqlite"
