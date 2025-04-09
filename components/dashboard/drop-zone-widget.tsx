"use client"

import { useNotification } from "@/app/(app)/context"
import { uploadFilesAction } from "@/app/(app)/files/actions"
import { FormError } from "@/components/forms/error"
import config from "@/lib/config"
import { Camera, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useState } from "react"

export default function DashboardDropZoneWidget() {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    setUploadError("")
    if (e.target.files && e.target.files.length > 0) {
      const formData = new FormData()

      // Append all selected files to the FormData
      for (let i = 0; i < e.target.files.length; i++) {
        formData.append("files", e.target.files[i])
      }

      // Submit the files using the server action
      startTransition(async () => {
        const result = await uploadFilesAction(formData)
        if (result.success) {
          showNotification({ code: "sidebar.unsorted", message: "new" })
          setTimeout(() => showNotification({ code: "sidebar.unsorted", message: "" }), 3000)
          router.push("/unsorted")
        } else {
          setUploadError(result.error ? result.error : "Something went wrong...")
        }
        setIsUploading(false)
      })
    }
  }

  return (
    <div className="flex w-full h-full">
      <label className="relative w-full h-full border-2 border-dashed rounded-lg transition-colors hover:border-primary cursor-pointer">
        <input
          type="file"
          id="fileInput"
          className="hidden"
          multiple
          accept={config.upload.acceptedMimeTypes}
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center h-full">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-lg font-medium">
              {isUploading ? "Uploading..." : "Take a photo or drop your files here"}
            </p>
            {!uploadError && (
              <p className="text-sm text-muted-foreground">
                upload receipts, invoices and any other documents for me to scan
              </p>
            )}
            {uploadError && <FormError>{uploadError}</FormError>}
          </div>
        </div>
      </label>
    </div>
  )
}
