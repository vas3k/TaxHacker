import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Uploading...",
}

export default function UploadStatusPage() {
  notFound()
}
