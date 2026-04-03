-- CreateTable
CREATE TABLE "import_batches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "matched_count" INTEGER NOT NULL DEFAULT 0,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "parsed_data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "transaction_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_matches" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "confidence" INTEGER NOT NULL,
    "matched_amount" INTEGER NOT NULL,
    "matched_date" TIMESTAMP(3) NOT NULL,
    "existing_date" TIMESTAMP(3) NOT NULL,
    "days_difference" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'auto_merged',
    "csv_data" JSONB NOT NULL,
    "merged_fields" JSONB,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_batches_user_id_idx" ON "import_batches"("user_id");
CREATE INDEX "import_batches_created_at_idx" ON "import_batches"("created_at");
CREATE INDEX "import_rows_batch_id_idx" ON "import_rows"("batch_id");
CREATE INDEX "import_rows_status_idx" ON "import_rows"("status");
CREATE INDEX "transaction_matches_batch_id_idx" ON "transaction_matches"("batch_id");
CREATE INDEX "transaction_matches_transaction_id_idx" ON "transaction_matches"("transaction_id");
CREATE INDEX "transaction_matches_confidence_idx" ON "transaction_matches"("confidence");
CREATE INDEX "transaction_matches_status_idx" ON "transaction_matches"("status");

-- AddForeignKey
ALTER TABLE "import_batches"
ADD CONSTRAINT "import_batches_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "import_rows"
ADD CONSTRAINT "import_rows_batch_id_fkey"
FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "import_rows"
ADD CONSTRAINT "import_rows_transaction_id_fkey"
FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transaction_matches"
ADD CONSTRAINT "transaction_matches_batch_id_fkey"
FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transaction_matches"
ADD CONSTRAINT "transaction_matches_transaction_id_fkey"
FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
