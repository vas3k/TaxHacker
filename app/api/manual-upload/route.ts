import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { getUserUploadsDirectory, safePathJoin, unsortedFilePath } from "@/lib/files";
import { createFile } from "@/models/files";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

const MANUAL_UPLOADS_ROOT = path.resolve("data/manual_uploads");

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const userFolder = path.join(MANUAL_UPLOADS_ROOT, user.email);
  let processed: string[] = [];
  let failed: string[] = [];
  try {
    const files = await fs.readdir(userFolder);
    for (const filename of files) {
      try {
        const filePath = path.join(userFolder, filename);
        const fileUuid = randomUUID();
        const relativeFilePath = unsortedFilePath(fileUuid, filename);
        const userUploadsDirectory = getUserUploadsDirectory(user);
        const destPath = safePathJoin(userUploadsDirectory, relativeFilePath);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        const buffer = await fs.readFile(filePath);
        await fs.writeFile(destPath, buffer);
        await createFile(user.id, {
          id: fileUuid,
          filename: filename,
          path: relativeFilePath,
          mimetype: "application/octet-stream",
          metadata: { size: buffer.length, lastModified: Date.now() },
        });
        await fs.unlink(filePath);
        processed.push(filename);
      } catch (err) {
        failed.push(filename);
      }
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message, processed, failed }, { status: 500 });
  }

  // Revalidate unsorted and layout consumers so counts update in the sidebar
  revalidatePath("/unsorted");
  revalidatePath("/");

  return NextResponse.json({ success: true, processed, failed });
}
