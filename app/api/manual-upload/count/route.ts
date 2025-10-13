import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

const MANUAL_UPLOADS_ROOT = path.resolve("data/manual_uploads");

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const userFolder = path.join(MANUAL_UPLOADS_ROOT, user.email);
  try {
    const files = await fs.readdir(userFolder);
    return NextResponse.json({ count: files.length });
  } catch (err) {
    return NextResponse.json({ count: 0 });
  }
}
