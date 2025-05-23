-- AlterTable
ALTER TABLE "files" ADD COLUMN     "is_splitted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "items" JSONB NOT NULL DEFAULT '[]';
