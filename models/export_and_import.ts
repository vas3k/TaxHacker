import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { formatDate } from "date-fns"
import { createCategory, getCategoryByCode } from "./categories"
import { createProject, getProjectByCode } from "./projects"
import { TransactionFilters } from "./transactions"

export type ExportFilters = TransactionFilters

export type ExportFields = string[]

export type ExportImportFieldSettings = {
  code: string
  type: string
  export?: (userId: string, value: any) => Promise<any>
  import?: (userId: string, value: any) => Promise<any>
}

export const EXPORT_AND_IMPORT_FIELD_MAP: Record<string, ExportImportFieldSettings> = {
  name: {
    code: "name",
    type: "string",
  },
  description: {
    code: "description",
    type: "string",
  },
  merchant: {
    code: "merchant",
    type: "string",
  },
  total: {
    code: "total",
    type: "number",
    export: async function (userId: string, value: number) {
      return value / 100
    },
    import: async function (userId: string, value: string) {
      const num = parseFloat(value)
      return isNaN(num) ? 0.0 : num * 100
    },
  },
  currencyCode: {
    code: "currencyCode",
    type: "string",
  },
  convertedTotal: {
    code: "convertedTotal",
    type: "number",
    export: async function (userId: string, value: number | null) {
      if (!value) {
        return null
      }
      return value / 100
    },
    import: async function (userId: string, value: string) {
      const num = parseFloat(value)
      return isNaN(num) ? 0.0 : num * 100
    },
  },
  convertedCurrencyCode: {
    code: "convertedCurrencyCode",
    type: "string",
  },
  type: {
    code: "type",
    type: "string",
    export: async function (userId: string, value: string | null) {
      return value ? value.toLowerCase() : ""
    },
    import: async function (userId: string, value: string) {
      return value.toLowerCase()
    },
  },
  note: {
    code: "note",
    type: "string",
  },
  categoryCode: {
    code: "categoryCode",
    type: "string",
    export: async function (userId: string, value: string | null) {
      if (!value) {
        return null
      }
      const category = await getCategoryByCode(userId, value)
      return category?.name
    },
    import: async function (userId: string, value: string) {
      const category = await importCategory(userId, value)
      return category?.code
    },
  },
  projectCode: {
    code: "projectCode",
    type: "string",
    export: async function (userId: string, value: string | null) {
      if (!value) {
        return null
      }
      const project = await getProjectByCode(userId, value)
      return project?.name
    },
    import: async function (userId: string, value: string) {
      const project = await importProject(userId, value)
      return project?.code
    },
  },
  issuedAt: {
    code: "issuedAt",
    type: "date",
    export: async function (userId: string, value: Date | null) {
      if (!value || isNaN(value.getTime())) {
        return null
      }

      try {
        return formatDate(value, "yyyy-MM-dd")
      } catch (error) {
        return null
      }
    },
    import: async function (userId: string, value: string) {
      try {
        // Parse date-only strings as local midnight to avoid timezone shift
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return new Date(value + "T00:00:00")
        }
        return new Date(value)
      } catch {
        return null
      }
    },
  },
}

export const importProject = async (userId: string, name: string) => {
  const code = codeFromName(name)

  const existingProject = await prisma.project.findFirst({
    where: {
      OR: [{ code }, { name }],
    },
  })

  if (existingProject) {
    return existingProject
  }

  return await createProject(userId, { code, name })
}

export const importCategory = async (userId: string, name: string) => {
  const code = codeFromName(name)

  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [{ code }, { name }],
    },
  })

  if (existingCategory) {
    return existingCategory
  }

  return await createCategory(userId, { code, name })
}
