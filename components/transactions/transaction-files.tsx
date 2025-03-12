"use client"

import { deleteTransactionFileAction, uploadTransactionFileAction } from "@/app/transactions/actions"
import { FilePreview } from "@/components/files/preview"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FILE_ACCEPTED_MIMETYPES } from "@/lib/files"
import { File, Transaction } from "@prisma/client"
import { Loader2, Upload } from "lucide-react"
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
      formData.append("file", e.target.files[0])
      await uploadTransactionFileAction(formData)
      setIsUploading(false)
    }
  }

  return (
    <>
      {files.map((file) => (
        <Card key={file.id} className="p-4">
          <FilePreview file={file} />

          <Button type="button" onClick={() => handleDeleteFile(file.id)} variant="destructive" className="w-full">
            Delete File
          </Button>
        </Card>
      ))}

      <Card className="relative h-32 p-4">
        <input type="hidden" name="transactionId" value={transaction.id} />
        <label
          className="h-full w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
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
            </>
          )}
          <input
            type="file"
            name="file"
            className="absolute inset-0 top-0 left-0 w-full h-full opacity-0"
            onChange={handleFileChange}
            accept={FILE_ACCEPTED_MIMETYPES}
          />
        </label>
      </Card>
    </>
  )
}
