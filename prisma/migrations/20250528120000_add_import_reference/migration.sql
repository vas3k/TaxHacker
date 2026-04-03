-- AlterTable
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "import_reference" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "last_matched_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transactions_import_reference_idx" ON "transactions"("import_reference");
