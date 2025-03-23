-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fields" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "llm_prompt" TEXT,
    "options" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_visible_in_list" BOOLEAN NOT NULL DEFAULT false,
    "is_visible_in_analysis" BOOLEAN NOT NULL DEFAULT false,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_extra" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_fields" ("code", "is_extra", "is_required", "is_visible_in_analysis", "is_visible_in_list", "llm_prompt", "name", "options", "type") SELECT "code", "is_extra", "is_required", "is_visible_in_analysis", "is_visible_in_list", "llm_prompt", "name", "options", "type" FROM "fields";
DROP TABLE "fields";
ALTER TABLE "new_fields" RENAME TO "fields";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
