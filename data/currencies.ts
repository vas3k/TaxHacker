import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { cache } from "react"

export const getCurrencies = cache(async () => {
  return await prisma.currency.findMany({
    orderBy: {
      code: "asc",
    },
  })
})

export const createCurrency = async (currency: Prisma.CurrencyCreateInput) => {
  return await prisma.currency.create({
    data: currency,
  })
}

export const updateCurrency = async (code: string, currency: Prisma.CurrencyUpdateInput) => {
  return await prisma.currency.update({
    where: { code },
    data: currency,
  })
}

export const deleteCurrency = async (code: string) => {
  return await prisma.currency.delete({
    where: { code },
  })
}
