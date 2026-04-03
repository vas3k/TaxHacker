"use client"

import {
  parseCSVAction,
  saveTransactionsAction,
  saveTransactionsWithMatchingAction,
} from "@/app/(app)/import/csv/actions"
import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import { Field, Project } from "@/prisma/client"
import { Loader2, Play, Upload, CheckCircle2, AlertCircle, PlusCircle, Flag } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useMemo, useState } from "react"
import { generateUUID } from "@/lib/utils"
import { CSVFormat, getFormatInfo } from "@/lib/csv/format-detector"
import { ProjectMappingChoice, ProjectMappingsInput } from "@/types/import"

const MAX_PREVIEW_ROWS = 100

export function ImportCSVTable({ fields, projects }: { fields: Field[]; projects: Project[] }) {
  const router = useRouter()
  const [parseState, parseAction, isParsing] = useActionState(parseCSVAction, null)
  const [saveState, saveAction, isSaving] = useActionState(saveTransactionsAction, null)
  const [saveMatchingState, saveMatchingAction, isSavingWithMatching] = useActionState(
    saveTransactionsWithMatchingAction,
    null
  )

  const [csvSettings, setCSVSettings] = useState({
    skipHeader: true,
    enableMatching: true, // Enable matching by default
  })
  const [csvData, setCSVData] = useState<string[][]>([])
  const [csvFormat, setCSVFormat] = useState<CSVFormat>('generic')
  const [columnMappings, setColumnMappings] = useState<string[]>([])
  const [uploadedFilename, setUploadedFilename] = useState<string>("")
  const [importStats, setImportStats] = useState<{
    matched: number
    created: number
    flagged: number
    errors: number
  } | null>(null)
  const [poNumbers, setPoNumbers] = useState<string[]>([])
  const [poMappings, setPoMappings] = useState<ProjectMappingsInput>({})

  const headerRow = useMemo(
    () => (csvData[0] ?? []).map((header) => header.replace(/^\uFEFF/, "")),
    [csvData]
  )

  useEffect(() => {
    if (parseState?.success && parseState.data) {
      const { rows, format } = parseState.data
      setCSVData(rows)
      setCSVFormat(format)

      if (rows.length > 0) {
        if (format === 'amazon' || format === 'amex' || format === 'chase') {
          setColumnMappings([])
        } else {
          setColumnMappings(
            rows[0].map((value) => {
              const trimmedValue = value.replace(/^\uFEFF/, "")
              const field = fields.find((field) => field.code === trimmedValue || field.name === trimmedValue)
              return field?.code || ""
            })
          )
        }

        if (format === 'amazon') {
          const headerIndex = rows[0].findIndex((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase() === "po number")
          if (headerIndex >= 0) {
            const values = Array.from(
              new Set(
                rows
                  .slice(1)
                  .map((row) => (row[headerIndex] || "").toString().trim())
                  .filter((value) => value.length > 0)
              )
            )
            setPoNumbers(values)
            setPoMappings((prev) => {
              const next: ProjectMappingsInput = {}
              values.forEach((po) => {
                const existing = prev[po]
                if (existing) {
                  next[po] = existing
                  return
                }
                const matched = projects.find(
                  (project) => project.code === po || project.name?.toLowerCase() === po.toLowerCase()
                )
                if (matched) {
                  next[po] = { mode: "existing", code: matched.code }
                } else {
                  next[po] = { mode: "new", name: po }
                }
              })
              return next
            })
          } else {
            setPoNumbers([])
            setPoMappings({})
          }
        } else {
          setPoNumbers([])
          setPoMappings({})
        }
      } else {
        setColumnMappings([])
        setPoNumbers([])
        setPoMappings({})
      }
    }
  }, [parseState, fields, projects])

  useEffect(() => {
    if (saveState?.success) {
      router.push("/transactions")
    }
  }, [saveState, router])

  useEffect(() => {
    if (saveMatchingState?.success && saveMatchingState.data?.batchId) {
      // Redirect to import history to see results
      router.push(`/import/history/${saveMatchingState.data.batchId}`)
    }
  }, [saveMatchingState, router])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFilename(file.name)
    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      await parseAction(formData)
    })
  }

  const handleMappingChange = (columnIndex: number, fieldCode: string) => {
    setColumnMappings((prev) => {
      const state = [...prev]
      state[columnIndex] = fieldCode
      return state
    })
  }

  const handleSave = async () => {
    console.log('[Import] handleSave called', {
      csvDataLength: csvData.length,
      format: csvFormat,
      matchingEnabled: csvSettings.enableMatching
    })

    if (csvData.length === 0) return

    // Skip validation for Amazon format (no mapping needed)
    if (csvFormat === 'generic' && !isAtLeastOneFieldMapped(columnMappings)) {
      alert("Please map at least one column to a field")
      return
    }

    const formData = new FormData()

    const buildRowObjects = () => {
      const startIndex = csvSettings.skipHeader ? 1 : 0
      return csvData.slice(startIndex).map((row) => {
        const obj: Record<string, unknown> = {}
        headerRow.forEach((header, index) => {
          if (!header) return
          obj[header] = row[index] || ""
        })
        return obj
      })
    }

    if (csvFormat === 'amazon' || csvFormat === 'amex' || csvFormat === 'chase') {
      const structuredRows = buildRowObjects()
      console.log('[Import] Built structured rows:', {
        count: structuredRows.length,
        format: csvFormat,
        firstRowKeys: structuredRows[0] ? Object.keys(structuredRows[0]).slice(0, 10) : []
      })
      formData.append("rows", JSON.stringify(structuredRows))
      if (csvFormat === 'amazon' && poNumbers.length > 0) {
        console.log('[Import] Adding project mappings:', poMappings)
        formData.append("projectMappings", JSON.stringify(poMappings))
      }
    } else {
      // Generic: Map columns to fields (existing logic)
      const startIndex = csvSettings.skipHeader ? 1 : 0
      const processedRows = csvData.slice(startIndex).map((row) => {
        const processedRow: Record<string, unknown> = {}

        columnMappings.forEach((fieldCode, columnIndex) => {
          if (!fieldCode || !row[columnIndex]) return
          processedRow[fieldCode] = row[columnIndex]
        })

        return processedRow
      })

      formData.append("rows", JSON.stringify(processedRows))
    }

    formData.append("format", csvFormat)

    // Use matching action if enabled
    if (csvSettings.enableMatching) {
      const progressId = generateUUID()
      formData.append("filename", uploadedFilename || "upload.csv")
      if (csvFormat === 'generic') {
        formData.append(
          "columnMappings",
          JSON.stringify(
            Object.fromEntries(columnMappings.map((code, idx) => [idx, code]).filter(([_, code]) => code))
          )
        )
      } else {
        formData.append("columnMappings", JSON.stringify({}))
      }
      formData.append("progressId", progressId)

      console.log('[Import] Calling saveMatchingAction...')
      startTransition(async () => {
        console.log('[Import] Inside startTransition, calling action now...')
        await saveMatchingAction(formData)
        console.log('[Import] Action completed')
      })
    } else {
      // Use simple import without matching
      startTransition(async () => {
        await saveAction(formData)
      })
    }
  }

  return (
    <>
      {csvData.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[400px]">
          <p className="text-muted-foreground">Upload your CSV file to import transactions</p>
          <div className="flex flex-row gap-5 mt-8">
            <div>
              <input type="file" accept=".csv" className="hidden" id="csv-file" onChange={handleFileChange} />
              <Button type="button" onClick={() => document.getElementById("csv-file")?.click()}>
                {isParsing ? "Parsing..." : <Upload className="mr-2" />} Import from CSV
              </Button>
            </div>
          </div>
          {parseState?.error && <FormError>{parseState.error}</FormError>}
        </div>
      )}

      {csvData.length > 0 && (
        <div>
          <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
            <h2 className="flex flex-row gap-3 md:gap-5">
              <span className="text-3xl font-bold tracking-tight">Import {csvData.length} items from CSV</span>
            </h2>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving || isSavingWithMatching}>
                {isSaving || isSavingWithMatching ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {csvSettings.enableMatching ? "Importing with matching..." : "Importing..."}
                  </>
                ) : (
                  <>
                    <Play />
                    {csvSettings.enableMatching
                      ? `Import & Match ${csvData.length} transactions`
                      : `Import ${csvData.length} transactions`}
                  </>
                )}
              </Button>
            </div>
          </header>

          {/* Format detection indicator */}
          {csvFormat !== 'generic' && (
            <div className="mb-4 p-4 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 border border-blue-200/50 rounded-md">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">{getFormatInfo(csvFormat).name} detected</p>
                  <p className="text-sm text-blue-700 mt-1">{getFormatInfo(csvFormat).description}</p>
                  <ul className="mt-2 space-y-1">
                    {getFormatInfo(csvFormat).features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-blue-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                id="skip-header"
                defaultChecked={csvSettings.skipHeader}
                onChange={(e) => setCSVSettings({ ...csvSettings, skipHeader: e.target.checked })}
              />
              <span>First row is a header</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                id="enable-matching"
                checked={csvSettings.enableMatching}
                onChange={(e) =>
                  setCSVSettings({ ...csvSettings, enableMatching: e.target.checked })
                }
              />
              <span className="flex items-center gap-2">
                Enable duplicate detection & auto-merge
                <span className="text-xs text-muted-foreground">
                  (Matches by exact amount + date within ±3 days)
                </span>
              </span>
            </label>

            {csvSettings.enableMatching && (
              <div className="ml-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm">
                <p className="font-medium mb-1">How matching works:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                    <span>
                      ≥90% confidence (same day or ±1 day) → <strong>Auto-merged</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Flag className="h-4 w-4 mt-0.5 text-yellow-600" />
                    <span>
                      70-89% confidence (±2-3 days) → <strong>Flagged for review</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span>
                      No match found → <strong>Created as new</strong>
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {(saveMatchingState?.error || saveState?.error) && (
            <FormError>{saveMatchingState?.error || saveState?.error}</FormError>
          )}

          {csvFormat === 'amazon' && poNumbers.length > 0 && (
            <div className="rounded-md border p-4 mb-4">
              <h3 className="font-semibold mb-2">PO Number to Project Mapping</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Assign each PO Number to an existing project or create a new one. Transactions from that PO will use the selected project.
              </p>
              <div className="space-y-4">
                {poNumbers.map((po) => {
                  const mapping = poMappings[po] || { mode: "new", name: po }
                  const selectValue = mapping.mode === "existing" ? mapping.code : "__new__"
                  return (
                    <div key={po} className="flex flex-col gap-2 border rounded-md p-3">
                      <div className="text-sm font-medium">PO Number: {po}</div>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <select
                          className="w-full md:w-1/3 p-2 border rounded-md"
                          value={selectValue}
                          onChange={(e) => {
                            const value = e.target.value
                            setPoMappings((prev) => {
                              const next = { ...prev }
                              if (value === "__new__") {
                                next[po] = { mode: "new", name: mapping.mode === "new" ? mapping.name : po }
                              } else {
                                next[po] = { mode: "existing", code: value }
                              }
                              return next as ProjectMappingsInput
                            })
                          }}
                        >
                          <option value="__new__">Create new project "{mapping.mode === "new" ? mapping.name : po}"</option>
                          {projects.map((project) => (
                            <option key={project.code} value={project.code}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                        {mapping.mode === "new" && (
                          <input
                            className="w-full md:flex-1 p-2 border rounded-md"
                            value={mapping.name}
                            onChange={(e) => {
                              const value = e.target.value
                              setPoMappings((prev) => ({
                                ...prev,
                                [po]: { mode: "new", name: value || po },
                              }))
                            }}
                            placeholder="New project name"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Column mapping table (Generic format only) */}
          {csvFormat === 'generic' && (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    {headerRow.map((_, index) => (
                      <th key={index} className="h-12 min-w-[200px] px-4 text-left align-middle font-medium">
                        <select
                          className="w-full p-2 border rounded-md"
                          value={columnMappings[index] || ""}
                          onChange={(e) => handleMappingChange(index, e.target.value)}
                        >
                          <option value="">Skip column</option>
                          {fields.map((field) => (
                            <option key={field.code} value={field.code}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {csvData.slice(0, MAX_PREVIEW_ROWS).map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-b transition-colors hover:bg-muted/50 ${
                        rowIndex === 0 && csvSettings.skipHeader ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {headerRow.map((_, colIndex) => (
                        <td key={colIndex} className="p-4 align-middle">
                          {(row[colIndex] || "").toString().slice(0, 256)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Read-only preview for auto-detected formats */}
          {csvFormat !== 'generic' && (
            <div className="rounded-md border mt-6">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b">
                      {headerRow.map((header, index) => (
                        <th key={index} className="h-12 min-w-[180px] px-4 text-left font-medium">
                          {header || `Column ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {csvData.slice(0, MAX_PREVIEW_ROWS).map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={`border-b transition-colors hover:bg-muted/30 ${
                          rowIndex === 0 && csvSettings.skipHeader ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {headerRow.map((_, colIndex) => (
                          <td key={colIndex} className="p-4 align-middle">
                            {(row[colIndex] || "").toString().slice(0, 256)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {csvData.length > MAX_PREVIEW_ROWS && (
            <p className="text-muted-foreground mt-4">and {csvData.length - MAX_PREVIEW_ROWS} more entries...</p>
          )}
        </div>
      )}
    </>
  )
}

function isAtLeastOneFieldMapped(columnMappings: string[]) {
  return columnMappings.some((mapping) => mapping !== "")
}
