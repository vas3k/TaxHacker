-- CreateTable
CREATE TABLE "transaction_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "field_name" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_audit_logs_transaction_id_idx" ON "transaction_audit_logs"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_audit_logs_user_id_idx" ON "transaction_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "transaction_audit_logs_created_at_idx" ON "transaction_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "transaction_audit_logs_action_idx" ON "transaction_audit_logs"("action");

-- AddForeignKey
ALTER TABLE "transaction_audit_logs" ADD CONSTRAINT "transaction_audit_logs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_audit_logs" ADD CONSTRAINT "transaction_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
