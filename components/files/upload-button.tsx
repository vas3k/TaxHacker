"use client"

import { useNotification } from "@/app/(app)/context"
import { uploadFilesAction } from "@/app/(app)/files/actions"
import { Button } from "@/components/ui/button"
import { FILE_ACCEPTED_MIMETYPES } from "@/lib/constants"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { ComponentProps, startTransition, useRef, useState } from "react"

export function UploadButton({ children, ...props }: { children: React.ReactNode } & ComponentProps<typeof Button>) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("")
    setIsUploading(true)
    if (e.target.files && e.target.files.length > 0) {
      const formData = new FormData()

      // Append all selected files to the FormData
      for (let i = 0; i < e.target.files.length; i++) {
        formData.append("files", e.target.files[i])
      }

      // Submit the files using the server action
      startTransition(async () => {
        const result = await uploadFilesAction(null, formData)
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

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent any form submission
    fileInputRef.current?.click()
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        id="fileInput"
        className="hidden"
        multiple
        accept={FILE_ACCEPTED_MIMETYPES}
        onChange={handleFileChange}
      />

      <Button onClick={handleButtonClick} disabled={isUploading} type="button" {...props}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>{children}</>
        )}
      </Button>

      {uploadError && <span className="text-red-500">⚠️ {uploadError}</span>}
    </div>
  )
}
