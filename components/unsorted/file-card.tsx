"use client"

import { useNotification } from "@/app/(app)/context"
import { mergeWithExistingTransactionAction } from "@/app/(app)/unsorted/actions"
import { FilePreview } from "@/components/files/preview"
import { Card } from "@/components/ui/card"
import AnalyzeForm from "@/components/unsorted/analyze-form"
import { MatchesPanel } from "@/components/unsorted/matches-panel"
import { Category, Currency, Field, File, Project } from "@/prisma/client"
import { startTransition, useState } from "react"

type UnsortedFileCardProps = {
  file: File
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}

export function UnsortedFileCard({
  file,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: UnsortedFileCardProps) {
  const { showNotification } = useNotification()
  const [matchData, setMatchData] = useState<{
    batchId: string
    matches: Array<{
      transactionId: string
      confidence: number
      transaction: any
    }>
  } | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const [currentFormData, setCurrentFormData] = useState<any>({})

  const handleMerge = async (transactionId: string, confidence: number) => {
    if (!matchData) return

    setIsMerging(true)

    try {
      const mergeFormData = new FormData()
      mergeFormData.append('fileId', file.id)
      mergeFormData.append('transactionId', transactionId)
      mergeFormData.append('batchId', matchData.batchId)
      mergeFormData.append('confidence', confidence.toString())
      mergeFormData.append('mergeData', JSON.stringify({
        ...currentFormData,
        total: currentFormData.total,
        issuedAt: currentFormData.issuedAt,
        name: currentFormData.name,
        merchant: currentFormData.merchant,
        description: currentFormData.description,
        categoryCode: currentFormData.categoryCode,
        projectCode: currentFormData.projectCode,
        note: currentFormData.note,
        currencyCode: currentFormData.currencyCode,
      }))

      const result = await mergeWithExistingTransactionAction(null, mergeFormData)

      if (result.success) {
        showNotification({
          code: 'global.banner',
          message: 'Successfully merged with existing transaction!',
          type: 'success',
        })
        showNotification({ code: 'sidebar.unsorted', message: 'new' })
        setTimeout(() => showNotification({ code: 'sidebar.unsorted', message: '' }), 3000)

        // Clear match data
        setMatchData(null)
      } else {
        showNotification({
          code: 'global.banner',
          message: result.error || 'Failed to merge',
          type: 'failed',
        })
      }
    } catch (error) {
      console.error('Failed to merge:', error)
      showNotification({
        code: 'global.banner',
        message: 'An error occurred while merging',
        type: 'failed',
      })
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <Card
      id={file.id}
      className="flex flex-row flex-wrap xl:flex-nowrap justify-start items-start gap-5 p-5 bg-gradient-to-br from-violet-50/80 via-indigo-50/80 to-white border-violet-200/60 rounded-2xl"
    >
      {/* File Preview - Left */}
      <div className="w-full xl:w-auto xl:max-w-[500px] flex-shrink-0">
        <Card>
          <FilePreview file={file} />
        </Card>
      </div>

      {/* Analyze Form - Center */}
      <div className="w-full xl:flex-1 min-w-0">
        <AnalyzeForm
          file={file}
          categories={categories}
          projects={projects}
          currencies={currencies}
          fields={fields}
          settings={settings}
          matchData={matchData}
          onMatchDataChange={setMatchData}
          onFormDataUpdate={setCurrentFormData}
          isMerging={isMerging}
        />
      </div>

      {/* Matches Panel - Right (only visible when matches exist) */}
      {matchData && matchData.matches.length > 0 && (
        <div className="w-full xl:w-auto xl:max-w-[400px] flex-shrink-0">
          <MatchesPanel
            matchData={matchData}
            formData={currentFormData}
            onMerge={handleMerge}
            isProcessing={isMerging}
          />
        </div>
      )}
    </Card>
  )
}
