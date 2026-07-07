-- AlterTable
ALTER TABLE "files" ADD COLUMN     "paperless_document_id" INTEGER;

-- CreateIndex
CREATE INDEX "files_user_id_paperless_document_id_idx" ON "files"("user_id", "paperless_document_id");
