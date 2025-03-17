"use client"

import { File } from "@prisma/client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function FilePreview({ file }: { file: File }) {
  const [isEnlarged, setIsEnlarged] = useState(false)

  const fileSize =
    file.metadata && typeof file.metadata === "object" && "size" in file.metadata
      ? Number(file.metadata.size) / 1024 / 1024
      : 0

  return (
    <>
      <div className="flex flex-col gap-2 p-4 overflow-hidden">
        <div className="aspect-[3/4]">
          <Image
            src={`/files/preview/${file.id}`}
            alt={file.filename}
            width={300}
            height={400}
            loading="lazy"
            className={`${
              isEnlarged
                ? "fixed inset-0 z-50 m-auto w-screen h-screen object-contain cursor-zoom-out"
                : "w-full h-full object-contain cursor-zoom-in"
            }`}
            onClick={() => setIsEnlarged(!isEnlarged)}
          />
          {isEnlarged && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsEnlarged(false)} />
          )}
        </div>
        <div className="flex flex-col gap-2 mt-2 overflow-hidden">
          <h2 className="text-md underline font-semibold overflow-ellipsis">
            <Link href={`/files/download/${file.id}`}>{file.filename}</Link>
          </h2>
          <p className="text-sm overflow-ellipsis">
            <strong>Type:</strong> {file.mimetype}
          </p>
          <p className="text-sm">
            <strong>Size:</strong> {fileSize < 1 ? (fileSize * 1024).toFixed(2) + " KB" : fileSize.toFixed(2) + " MB"}
          </p>
          <p className="text-xs overflow-ellipsis">
            <strong>Path:</strong> {file.path}
          </p>
        </div>
      </div>
    </>
  )
}
