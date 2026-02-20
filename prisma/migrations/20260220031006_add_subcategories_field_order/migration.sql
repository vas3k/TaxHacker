-- AlterTable: Add parent_code to categories for subcategory support
ALTER TABLE "categories" ADD COLUMN "parent_code" TEXT;

-- AddForeignKey: Self-referential relation for subcategories
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_code_user_id_fkey" FOREIGN KEY ("parent_code", "user_id") REFERENCES "categories"("code", "user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add order column to fields for drag-and-drop reordering
ALTER TABLE "fields" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
