import { prisma } from "@/lib/db"
import { prepareJsonField } from "@/lib/db-compat"

type BackupSetting = {
  filename: string
  model: any
  backup: (userId: string, row: any) => Record<string, any>
  restore: (userId: string, json: Record<string, any>) => any
}

// Ordering is important here
export const MODEL_BACKUP: BackupSetting[] = [
  {
    filename: "settings.json",
    model: prisma.setting,
    backup: (userId: string, row: any) => {
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        value: row.value,
      }
    },
    restore: (userId: string, json: any) => {
      return {
        code: json.code,
        name: json.name,
        description: json.description,
        value: json.value,
        user: {
          connect: {
            id: userId,
          },
        },
      }
    },
  },
  {
    filename: "currencies.json",
    model: prisma.currency,
    backup: (userId: string, row: any) => {
      return {
        id: row.id,
        code: row.code,
        name: row.name,
      }
    },
    restore: (userId: string, json: any) => {
      return {
        code: json.code,
        name: json.name,
        user: {
          connect: {
            id: userId,
          },
        },
      }
    },
  },
  {
    filename: "categories.json",
    model: prisma.category,
    backup: (userId: string, row: any) => {
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        color: row.color,
        llm_prompt: row.llm_prompt,
        createdAt: row.createdAt,
      }
    },
    restore: (userId: string, json: any) => {
      return {
        code: json.code,
        name: json.name,
        color: json.color,
        llm_prompt: json.llm_prompt,
        createdAt: json.createdAt,
        user: {
          connect: {
            id: userId,
          },
        },
      }
    },
  },
  {
    filename: "projects.json",
    model: prisma.project,
    backup: (userId: string, row: any) => {
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        color: row.color,
        llm_prompt: row.llm_prompt,
        createdAt: row.createdAt,
      }
    },
    restore: (userId: string, json: any) => {
      return {
        code: json.code,
        name: json.name,
        color: json.color,
        llm_prompt: json.llm_prompt,
        createdAt: json.createdAt,
        user: {
          connect: {
            id: userId,
          },
        },
      }
    },
  },
  {
    filename: "fields.json",
    model: prisma.field,
    backup: (userId: string, row: any) => {
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type,
        llm_prompt: row.llm_prompt,
        options: row.options,
        isVisibleInList: row.isVisibleInList,
        isVisibleInAnalysis: row.isVisibleInAnalysis,
        isRequired: row.isRequired,
        isExtra: row.isExtra,
      }
    },
    restore: (userId: string, json: any) => {
      return {
        code: json.code,
        name: json.name,
        type: json.type,
        llm_prompt: json.llm_prompt,
        options: json.options,
        isVisibleInList: json.isVisibleInList,
        isVisibleInAnalysis: json.isVisibleInAnalysis,
        isRequired: json.isRequired,
        isExtra: json.isExtra,
        user: {
          connect: {
            id: userId,
          },
        },
      }
    },
  },
  {
    filename: "files.json",
    model: prisma.file,
    backup: (userId: string, row: any) => {
      return {
        id: row.id,
        filename: row.filename,
        path: row.path,
        metadata: row.metadata,
        isReviewed: row.isReviewed,
        mimetype: row.mimetype,
        createdAt: row.createdAt,
      }
    },
    restore: (userId: string, json: any) => {
      return {
        id: json.id,
        filename: json.filename,
        path: json.path ? json.path.replace(/^.*\/uploads\//, "") : "",
        metadata: json.metadata ? prepareJsonField(json.metadata) : null,
        isReviewed: json.isReviewed,
        mimetype: json.mimetype,
        user: {
          connect: {
            id: userId,
          },
        },
      }
    },
  },
  {
    filename: "transactions.json",
    model: prisma.transaction,
    backup: (userId: string, row: any) => {
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        merchant: row.merchant,
        total: row.total,
        currencyCode: row.currencyCode,
        convertedTotal: row.convertedTotal,
        convertedCurrencyCode: row.convertedCurrencyCode,
        type: row.type,
        note: row.note,
        files: row.files,
        items: row.items,
        extra: row.extra,
        categoryCode: row.categoryCode,
        projectCode: row.projectCode,
        issuedAt: row.issuedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        text: row.text,
      }
    },
    restore: (userId: string, json: any) => {
      return {
        id: json.id,
        name: json.name,
        description: json.description,
        merchant: json.merchant,
        total: json.total,
        currencyCode: json.currencyCode,
        convertedTotal: json.convertedTotal,
        convertedCurrencyCode: json.convertedCurrencyCode,
        type: json.type,
        note: json.note,
        files: prepareJsonField(json.files || []),
        items: prepareJsonField(json.items || []),
        extra: json.extra ? prepareJsonField(json.extra) : null,
        issuedAt: json.issuedAt,
        user: {
          connect: {
            id: userId,
          },
        },
        category: {
          connect: {
            userId_code: { userId, code: json.categoryCode },
          },
        },
        project: {
          connect: {
            userId_code: { userId, code: json.projectCode },
          },
        },
      }
    },
  },
]

export async function modelToJSON(userId: string, backupSettings: BackupSetting): Promise<string> {
  const data = await backupSettings.model.findMany({ where: { userId } })

  if (!data || data.length === 0) {
    return "[]"
  }

  return JSON.stringify(
    data.map((row: any) => backupSettings.backup(userId, row)),
    null,
    2
  )
}

export async function modelFromJSON(
  userId: string,
  backupSettings: BackupSetting,
  jsonContent: string
): Promise<number> {
  if (!jsonContent) return 0

  try {
    const records = JSON.parse(jsonContent)

    if (!records || records.length === 0) {
      return 0
    }

    let insertedCount = 0
    for (const rawRecord of records) {
      const record = preprocessRowData(rawRecord)

      try {
        const data = await backupSettings.restore(userId, record)
        await backupSettings.model.create({ data })
      } catch (error) {
        console.error(`Error importing record:`, error)
      }
      insertedCount++
    }

    return insertedCount
  } catch (error) {
    console.error(`Error parsing JSON content:`, error)
    return 0
  }
}

function preprocessRowData(row: Record<string, any>): Record<string, any> {
  const processedRow: Record<string, any> = {}

  for (const [key, value] of Object.entries(row)) {
    if (value === "" || value === "null" || value === undefined) {
      processedRow[key] = null
      continue
    }

    // Try to parse JSON for object fields
    if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
      try {
        processedRow[key] = JSON.parse(value)
        continue
      } catch (e) {
        // Not valid JSON, continue with normal processing
      }
    }

    // Handle dates (checking for ISO date format)
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
      processedRow[key] = new Date(value)
      continue
    }

    // Handle numbers
    if (typeof value === "string" && !isNaN(Number(value)) && key !== "id" && !key.endsWith("Code")) {
      // Convert numbers but preserving string IDs
      processedRow[key] = Number(value)
      continue
    }

    // Default: keep as is
    processedRow[key] = value
  }

  return processedRow
}
