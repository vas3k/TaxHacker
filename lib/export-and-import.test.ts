import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ prisma: {} }))
vi.mock("@/models/categories", () => ({ createCategory: vi.fn(), getCategoryByCode: vi.fn() }))
vi.mock("@/models/projects", () => ({ createProject: vi.fn(), getProjectByCode: vi.fn() }))

import { EXPORT_AND_IMPORT_FIELD_MAP } from "@/models/export_and_import"

describe("CSV import of amounts", () => {
  it("converts to whole cents without losing one to float error", async () => {
    expect(await EXPORT_AND_IMPORT_FIELD_MAP.total.import!("user", "4.35")).toBe(435)
    expect(await EXPORT_AND_IMPORT_FIELD_MAP.convertedTotal.import!("user", "9.95")).toBe(995)
  })
})
