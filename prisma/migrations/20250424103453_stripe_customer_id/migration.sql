/*
  Warnings:

  - You are about to drop the column `token_balance` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "token_balance",
ADD COLUMN     "ai_balance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripe_customer_id" TEXT;
