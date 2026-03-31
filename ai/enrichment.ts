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

// Keep 3-5 symbols to support common fiat (ISO-4217) and user-defined/crypto tickers used in the app.
const CURRENCY_CODE_REGEX = /^[A-Z]{3,5}$/
const DEFAULT_PYTHON_ENRICHER_TIMEOUT_MS = 1200
const SIGTERM_TO_SIGKILL_DELAY_MS = 100
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
      if (parsedDate.getTime() > Date.now()) {
        warnings.push("Detected date is in the future and may need manual correction.")
      }
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
  const rawValue = String(value).trim().replace(/\s+/g, "")
  let normalized = rawValue

  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(rawValue)) {
    normalized = rawValue.replace(/,/g, "")
  } else if (/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(rawValue)) {
    normalized = rawValue.replace(/\./g, "").replace(",", ".")
  } else if (rawValue.includes(",") && !rawValue.includes(".")) {
    normalized = rawValue.replace(",", ".")
  }

  const parsed = Number.parseFloat(normalized)
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
  const argsText = process.env.TAXHACKER_PYTHON_ENRICHER_ARGS?.trim()
  if (!commandText) return null

  const parsedCommand = parseCommand(commandText, argsText)
  const [command, ...args] = parsedCommand
  if (!command) return null

  const timeoutMs = getPythonEnricherTimeoutMs()

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      // Keep shell disabled so arguments are never interpreted by a shell.
      shell: false,
    })
    let didResolve = false

    const safeResolve = (value: PythonEnricherResponse | null) => {
      if (didResolve) return
      didResolve = true
      resolve(value)
    }

    const timeout = setTimeout(() => {
      child.kill("SIGTERM")
      setTimeout(() => child.kill("SIGKILL"), SIGTERM_TO_SIGKILL_DELAY_MS)
      console.warn("Python enricher timed out and was terminated")
      safeResolve(null)
    }, timeoutMs)

    const stdoutChunks: string[] = []
    const stderrChunks: string[] = []
    let stdoutSize = 0
    let stderrSize = 0

    child.stdout.on("data", (chunk: Buffer | string) => {
      if (stdoutSize < MAX_STDOUT_BUFFER_SIZE) {
        const chunkText = chunk.toString()
        stdoutChunks.push(chunkText)
        stdoutSize += chunkText.length
      }
    })

    child.stderr.on("data", (chunk: Buffer | string) => {
      if (stderrSize < MAX_STDERR_BUFFER_SIZE) {
        const chunkText = chunk.toString()
        stderrChunks.push(chunkText)
        stderrSize += chunkText.length
      }
    })

    child.on("error", () => {
      clearTimeout(timeout)
      safeResolve(null)
    })

    child.on("close", (code) => {
      clearTimeout(timeout)
      const stdout = stdoutChunks.join("")
      const stderr = stderrChunks.join("")
      if (code !== 0 || !stdout.trim()) {
        if (stderr) console.warn("Python enricher stderr:", stderr)
        safeResolve(null)
        return
      }
      try {
        const parsed = JSON.parse(stdout) as PythonEnricherResponse
        safeResolve(parsed)
      } catch {
        safeResolve(null)
      }
    })

    try {
      if (!child.stdin.writable) {
        safeResolve(null)
        return
      }
      child.stdin.write(JSON.stringify(payload))
      child.stdin.end()
    } catch {
      safeResolve(null)
    }
  })
}

function parseCommand(commandText: string, argsText?: string): string[] {
  if (!argsText) {
    const legacyTokens = commandText.split(/\s+/).filter(Boolean)
    if (legacyTokens.length > 1) {
      console.warn(
        "Legacy TAXHACKER_PYTHON_ENRICHER_CMD with inline args is deprecated; use TAXHACKER_PYTHON_ENRICHER_ARGS JSON array"
      )
      return legacyTokens
    }
    return [commandText]
  }

  try {
    const parsedArgs = JSON.parse(argsText)
    if (Array.isArray(parsedArgs) && parsedArgs.every((arg) => typeof arg === "string")) {
      return [commandText, ...parsedArgs]
    }
  } catch {
    // ignore malformed args config
  }

  return [commandText]
}

function getPythonEnricherTimeoutMs(): number {
  const timeoutRaw = process.env.TAXHACKER_PYTHON_ENRICHER_TIMEOUT_MS?.trim()
  if (!timeoutRaw) return DEFAULT_PYTHON_ENRICHER_TIMEOUT_MS

  const parsed = Number.parseInt(timeoutRaw, 10)
  if (Number.isNaN(parsed)) return DEFAULT_PYTHON_ENRICHER_TIMEOUT_MS
  if (parsed < 100) return 100
  if (parsed > 5000) return 5000
  return parsed
}
