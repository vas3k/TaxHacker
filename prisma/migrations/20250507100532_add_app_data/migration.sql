-- CreateTable
CREATE TABLE "app_data" (
    "id" UUID NOT NULL,
    "app" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "app_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_data_user_id_app_key" ON "app_data"("user_id", "app");

-- AddForeignKey
ALTER TABLE "app_data" ADD CONSTRAINT "app_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
