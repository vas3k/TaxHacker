-- AlterTable
ALTER TABLE "import_batches" ADD COLUMN "content_hash" TEXT;

-- CreateIndex
CREATE INDEX "import_batches_content_hash_idx" ON "import_batches"("content_hash");
