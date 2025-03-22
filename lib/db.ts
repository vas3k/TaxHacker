import { PrismaClient } from "@prisma/client"
import path from "path"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["query", "info", "warn", "error"] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export let DATABASE_FILE = process.env.DATABASE_URL?.replace("file:", "") ?? "db.sqlite"
if (DATABASE_FILE?.startsWith("/")) {
  DATABASE_FILE = path.resolve(process.cwd(), DATABASE_FILE)
} else {
  DATABASE_FILE = path.resolve(process.cwd(), "prisma", DATABASE_FILE)
}
