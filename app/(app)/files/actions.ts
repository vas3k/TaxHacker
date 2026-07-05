"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser, isSubscriptionExpired } from "@/lib/auth"
import { getDirectorySize, getUserUploadsDirectory, isEnoughStorageToUploadFile } from "@/lib/files"
import { ingestUnsortedFile } from "@/lib/uploads"
import { updateUser } from "@/models/users"
import { revalidatePath } from "next/cache"

export async function uploadFilesAction(formData: FormData): Promise<ActionState<null>> {
  const user = await getCurrentUser()
  const files = formData.getAll("files") as File[]

  // Check limits
  const totalFileSize = files.reduce((acc, file) => acc + file.size, 0)
  if (!isEnoughStorageToUploadFile(user, totalFileSize)) {
    return { success: false, error: `Insufficient storage to upload these files` }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
    }
  }

  // Process each file
  await Promise.all(
    files.map(async (file) => {
      if (!(file instanceof File)) {
        return { success: false, error: "Invalid file" }
      }
      const arrayBuffer = await file.arrayBuffer()
      return await ingestUnsortedFile(user, {
        buffer: Buffer.from(arrayBuffer),
        filename: file.name,
        mimetype: file.type,
        metadata: { lastModified: file.lastModified },
      })
    })
  )

  const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
  await updateUser(user.id, { storageUsed })

  revalidatePath("/unsorted")

  return { success: true, error: null }
}
