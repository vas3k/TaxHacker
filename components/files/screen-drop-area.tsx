"use client"

import { useNotification } from "@/app/(app)/context"
import { uploadFilesAction } from "@/app/(app)/files/actions"
import { uploadTransactionFilesAction } from "@/app/(app)/transactions/actions"
import { AlertCircle, CloudUpload, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { startTransition, useEffect, useRef, useState } from "react"

export default function ScreenDropArea({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const dragCounter = useRef(0)
  const { transactionId } = useParams()

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++

    if (dragCounter.current === 1) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--

    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // Reset counter and dragging state
    dragCounter.current = 0
    setIsDragging(false)
    setIsUploading(true)
    setUploadError("")

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      try {
        const formData = new FormData()
        if (transactionId) {
          formData.append("transactionId", transactionId as string)
        }
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i])
        }

        startTransition(async () => {
          const result = transactionId
            ? await uploadTransactionFilesAction(formData)
            : await uploadFilesAction(formData)

          if (result.success) {
            showNotification({ code: "sidebar.unsorted", message: "new" })
            setTimeout(() => showNotification({ code: "sidebar.unsorted", message: "" }), 3000)
            if (!transactionId) {
              router.push("/unsorted")
            }
          } else {
            setUploadError(result.error ? result.error : "Something went wrong...")
          }
          setIsUploading(false)
        })
      } catch (error) {
        console.error("Upload error:", error)
        setIsUploading(false)
        setUploadError(error instanceof Error ? error.message : "Something went wrong...")
      }
    }
  }

  // Add event listeners to document body
  useEffect(() => {
    document.body.addEventListener("dragenter", handleDragEnter as unknown as EventListener)
    document.body.addEventListener("dragover", handleDragOver as unknown as EventListener)
    document.body.addEventListener("dragleave", handleDragLeave as unknown as EventListener)
    document.body.addEventListener("drop", handleDrop as unknown as EventListener)

    return () => {
      document.body.removeEventListener("dragenter", handleDragEnter as unknown as EventListener)
      document.body.removeEventListener("dragover", handleDragOver as unknown as EventListener)
      document.body.removeEventListener("dragleave", handleDragLeave as unknown as EventListener)
      document.body.removeEventListener("drop", handleDrop as unknown as EventListener)
    }
  }, [isDragging, handleDrop])

  return (
    <div className="relative min-h-screen w-full">
      {children}

      {isDragging && (
        <div
          className="fixed inset-0 bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
            <CloudUpload className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">
              {transactionId ? "Drop Files to Add to Transaction" : "Drop Files to Upload"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Drop anywhere on the screen</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
            <h3 className="text-xl font-semibold mb-2">
              {transactionId ? "Adding files to transaction..." : "Uploading..."}
            </h3>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold mb-2">Upload Error</h3>
            <p className="text-gray-600 dark:text-gray-400">{uploadError}</p>
          </div>
        </div>
      )}
    </div>
  )
}
