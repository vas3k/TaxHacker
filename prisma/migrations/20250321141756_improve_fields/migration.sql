/*
  Warnings:

  - The primary key for the `fields` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `fields` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fields" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "llm_prompt" TEXT,
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_extra" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_fields" ("code", "is_extra", "is_required", "llm_prompt", "name", "options", "type") SELECT "code", "is_extra", "is_required", "llm_prompt", "name", "options", "type" FROM "fields";
DROP TABLE "fields";
ALTER TABLE "new_fields" RENAME TO "fields";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "transactions_project_id_idx" ON "transactions"("project_id");

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

-- CreateIndex
CREATE INDEX "transactions_issued_at_idx" ON "transactions"("issued_at");

-- CreateIndex
CREATE INDEX "transactions_name_idx" ON "transactions"("name");

-- CreateIndex
CREATE INDEX "transactions_merchant_idx" ON "transactions"("merchant");

-- CreateIndex
CREATE INDEX "transactions_total_idx" ON "transactions"("total");
