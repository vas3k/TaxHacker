import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { formatDate } from "date-fns"
import { createCategory, getCategoryByCode } from "./categories"
import { createProject, getProjectByCode } from "./projects"
import { TransactionFilters } from "./transactions"

export type ExportFilters = TransactionFilters

export type ExportFields = string[]

export const exportImportFields = [
  {
    code: "name",
    type: "string",
  },
  {
    code: "description",
    type: "string",
  },
  {
    code: "merchant",
    type: "string",
  },
  {
    code: "total",
    type: "number",
    export: async function (value: number) {
      return value / 100
    },
    import: async function (value: string) {
      const num = parseFloat(value)
      return isNaN(num) ? 0.0 : num * 100
    },
  },
  {
    code: "currencyCode",
    type: "string",
  },
  {
    code: "convertedTotal",
    type: "number",
    export: async function (value: number | null) {
      if (!value) {
        return null
      }
      return value / 100
    },
    import: async function (value: string) {
      const num = parseFloat(value)
      return isNaN(num) ? 0.0 : num * 100
    },
  },
  {
    code: "convertedCurrencyCode",
    type: "string",
  },
  {
    code: "type",
    type: "string",
  },
  {
    code: "note",
    type: "string",
  },
  {
    code: "categoryCode",
    type: "string",
    export: async function (value: string | null) {
      if (!value) {
        return null
      }
      const category = await getCategoryByCode(value)
      return category?.name
    },
    import: async function (value: string) {
      const category = await importCategory(value)
      return category?.code
    },
  },
  {
    code: "projectCode",
    type: "string",
    export: async function (value: string | null) {
      if (!value) {
        return null
      }
      const project = await getProjectByCode(value)
      return project?.name
    },
    import: async function (value: string) {
      const project = await importProject(value)
      return project?.code
    },
  },
  {
    code: "issuedAt",
    type: "date",
    export: async function (value: Date | null) {
      if (!value || isNaN(value.getTime())) {
        return null
      }

      try {
        return formatDate(value, "yyyy-MM-dd")
      } catch (error) {
        return null
      }
    },
    import: async function (value: string) {
      try {
        return new Date(value)
      } catch (error) {
        return null
      }
    },
  },
]

export const exportImportFieldsMapping = exportImportFields.reduce((acc, field) => {
  acc[field.code] = field
  return acc
}, {} as Record<string, any>)

export const importProject = async (name: string) => {
  const code = codeFromName(name)

  const existingProject = await prisma.project.findFirst({
    where: {
      OR: [{ code }, { name }],
    },
  })

  if (existingProject) {
    return existingProject
  }

  return await createProject({ code, name })
}

export const importCategory = async (name: string) => {
  const code = codeFromName(name)

  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [{ code }, { name }],
    },
  })

  if (existingCategory) {
    return existingCategory
  }

  return await createCategory({ code, name })
}
