"use client"

import { deleteTransactionFileAction, uploadTransactionFilesAction } from "@/app/(app)/transactions/actions"
import { FilePreview } from "@/components/files/preview"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import config from "@/lib/config"
import { File, Transaction } from "@prisma/client"
import { Loader2, Upload, X } from "lucide-react"
import { useState } from "react"

export default function TransactionFiles({ transaction, files }: { transaction: Transaction; files: File[] }) {
  const [isUploading, setIsUploading] = useState(false)

  const handleDeleteFile = async (fileId: string) => {
    await deleteTransactionFileAction(transaction.id, fileId)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    if (e.target.files && e.target.files.length > 0) {
      const formData = new FormData()
      formData.append("transactionId", transaction.id)
      for (let i = 0; i < e.target.files.length; i++) {
        formData.append("files", e.target.files[i])
      }
      await uploadTransactionFilesAction(formData)
      setIsUploading(false)
    }
  }

  return (
    <>
      {files.map((file) => (
        <Card key={file.id} className="p-4 relative">
          <Button
            type="button"
            onClick={() => handleDeleteFile(file.id)}
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 rounded-full w-6 h-6 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          <FilePreview file={file} />
        </Card>
      ))}

      <Card className="relative min-h-32 p-4">
        <input type="hidden" name="transactionId" value={transaction.id} />
        <label
          className="h-full w-full flex flex-col gap-2 items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
          onDragEnter={(e) => {
            e.currentTarget.classList.add("border-primary")
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("border-primary")
          }}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-500">Add more files to this invoice</p>
              <p className="text-xs text-gray-500">(or just drop them on this page)</p>
            </>
          )}
          <input
            multiple
            type="file"
            name="file"
            className="absolute inset-0 top-0 left-0 w-full h-full opacity-0"
            onChange={handleFileChange}
            accept={config.upload.acceptedMimeTypes}
          />
        </label>
      </Card>
    </>
  )
}
