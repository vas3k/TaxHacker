"use server"

import { spawn } from "child_process"

export type AnalysisEnrichmentResult = {
  output: Record<string, unknown>
  warnings: string[]
  confidence: number
  usedPythonEnricher: boolean
}

type PythonEnricherResponse = {
  output?: Record<string, unknown>
  warnings?: string[]
  confidenceDelta?: number
}

const CURRENCY_CODE_REGEX = /^[A-Z]{3,5}$/
const PYTHON_ENRICHER_TIMEOUT_MS = 900
const MAX_STDOUT_BUFFER_SIZE = 20_000
const MAX_STDERR_BUFFER_SIZE = 4_000

export async function enrichAnalysisOutput(output: Record<string, unknown>): Promise<AnalysisEnrichmentResult> {
  const normalized = normalizeOutput(output)
  let warnings = [...normalized.warnings]
  let confidence = estimateConfidence(normalized.output, warnings)
  let usedPythonEnricher = false

  const pythonEnriched = await runPythonEnricher({
    output: normalized.output,
    warnings,
    confidence,
  })

  if (pythonEnriched) {
    usedPythonEnricher = true
    if (pythonEnriched.output && typeof pythonEnriched.output === "object") {
      normalized.output = {
        ...normalized.output,
        ...pythonEnriched.output,
      }
    }
    if (Array.isArray(pythonEnriched.warnings) && pythonEnriched.warnings.length > 0) {
      warnings = [...warnings, ...pythonEnriched.warnings.filter((warning) => typeof warning === "string")]
    }
    if (typeof pythonEnriched.confidenceDelta === "number") {
      confidence = clampConfidence(confidence + pythonEnriched.confidenceDelta)
    } else {
      confidence = estimateConfidence(normalized.output, warnings)
    }
  }

  return {
    output: normalized.output,
    warnings: Array.from(new Set(warnings)),
    confidence,
    usedPythonEnricher,
  }
}

function normalizeOutput(output: Record<string, unknown>): { output: Record<string, unknown>; warnings: string[] } {
  const normalized: Record<string, unknown> = { ...output }
  const warnings: string[] = []

  normalized.currencyCode = normalizeCurrencyCode(normalized.currencyCode, "currencyCode", warnings)
  normalized.convertedCurrencyCode = normalizeCurrencyCode(
    normalized.convertedCurrencyCode,
    "convertedCurrencyCode",
    warnings
  )

  normalized.total = normalizeMoneyValue(normalized.total)
  normalized.convertedTotal = normalizeMoneyValue(normalized.convertedTotal)

  if (normalized.issuedAt) {
    const parsedDate = new Date(String(normalized.issuedAt))
    if (!Number.isNaN(parsedDate.getTime())) {
      normalized.issuedAt = parsedDate.toISOString().split("T")[0]
    } else {
      warnings.push("Detected date is invalid and may need manual correction.")
    }
  }

  if (Array.isArray(normalized.items)) {
    normalized.items = normalized.items.map((item) => {
      if (!item || typeof item !== "object") {
        return item
      }
      const itemRecord = item as Record<string, unknown>
      return {
        ...itemRecord,
        total: normalizeMoneyValue(itemRecord.total),
        currencyCode: normalizeCurrencyCode(itemRecord.currencyCode, "items.currencyCode", warnings),
      }
    })
  }

  return { output: normalized, warnings }
}

function normalizeMoneyValue(value: unknown): unknown {
  if (value == null || value === "") return value
  if (typeof value === "number") return Number(value.toFixed(2))
  const parsed = Number.parseFloat(String(value).replace(",", "."))
  if (Number.isNaN(parsed)) return value
  return Number(parsed.toFixed(2))
}

function normalizeCurrencyCode(value: unknown, fieldName: string, warnings: string[]): unknown {
  if (typeof value !== "string") return value
  const normalized = value.trim().toUpperCase()
  if (!normalized) return value
  if (!CURRENCY_CODE_REGEX.test(normalized)) {
    warnings.push(`Detected ${fieldName} looks unusual: ${value}.`)
  }
  return normalized
}

function estimateConfidence(output: Record<string, unknown>, warnings: string[]): number {
  let confidence = 1
  const hasName = typeof output.name === "string" && output.name.trim().length > 1
  const hasMerchant = typeof output.merchant === "string" && output.merchant.trim().length > 1
  const hasIssuedAt = typeof output.issuedAt === "string" && output.issuedAt.trim().length > 0
  const totalValue = typeof output.total === "number" ? output.total : Number.parseFloat(String(output.total || ""))

  if (!hasName && !hasMerchant) confidence -= 0.25
  if (!hasIssuedAt) confidence -= 0.1
  if (Number.isNaN(totalValue)) confidence -= 0.2
  else if (totalValue <= 0) confidence -= 0.15

  const currencyCode =
    typeof output.currencyCode === "string" ? output.currencyCode.trim().toUpperCase() : String(output.currencyCode || "")
  if (!currencyCode || !CURRENCY_CODE_REGEX.test(currencyCode)) confidence -= 0.1

  confidence -= Math.min(warnings.length * 0.05, 0.25)
  return clampConfidence(confidence)
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))))
}

async function runPythonEnricher(payload: {
  output: Record<string, unknown>
  warnings: string[]
  confidence: number
}): Promise<PythonEnricherResponse | null> {
  const commandText = process.env.TAXHACKER_PYTHON_ENRICHER_CMD?.trim()
  if (!commandText) return null

  const [command, ...args] = commandText.split(/\s+/).filter(Boolean)
  if (!command) return null

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
    })
    const timeout = setTimeout(() => {
      child.kill("SIGKILL")
      resolve(null)
    }, PYTHON_ENRICHER_TIMEOUT_MS)

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk: Buffer | string) => {
      if (stdout.length < MAX_STDOUT_BUFFER_SIZE) {
        stdout += chunk.toString()
      }
    })

    child.stderr.on("data", (chunk: Buffer | string) => {
      if (stderr.length < MAX_STDERR_BUFFER_SIZE) {
        stderr += chunk.toString()
      }
    })

    child.on("error", () => {
      clearTimeout(timeout)
      resolve(null)
    })

    child.on("close", (code) => {
      clearTimeout(timeout)
      if (code !== 0 || !stdout.trim()) {
        if (stderr) console.warn("Python enricher stderr:", stderr)
        resolve(null)
        return
      }
      try {
        const parsed = JSON.parse(stdout) as PythonEnricherResponse
        resolve(parsed)
      } catch {
        resolve(null)
      }
    })

    child.stdin.write(JSON.stringify(payload))
    child.stdin.end()
  })
}
