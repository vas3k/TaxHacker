/*
  Warnings:

  - Made the column `storage_used` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `token_balance` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `storage_limit` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "storage_used" SET NOT NULL,
ALTER COLUMN "token_balance" SET NOT NULL,
ALTER COLUMN "storage_limit" SET NOT NULL;
