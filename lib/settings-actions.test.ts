import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/ai/providers/llmProvider", () => ({ testLLMProvider: vi.fn() }))
vi.mock("@/lib/config", () => ({ default: { selfHosted: { isEnabled: false } } }))
vi.mock("@/lib/uploads", () => ({ uploadStaticImage: vi.fn() }))
vi.mock("@/models/settings", () => ({ SELF_HOSTED_ONLY_SETTINGS: [], updateSettings: vi.fn() }))
vi.mock("@/models/users", () => ({ updateUser: vi.fn() }))
vi.mock("@/models/projects", () => ({ createProject: vi.fn(), updateProject: vi.fn(), deleteProject: vi.fn() }))
vi.mock("@/models/categories", () => ({ createCategory: vi.fn(), updateCategory: vi.fn(), deleteCategory: vi.fn() }))
vi.mock("@/models/currencies", () => ({ createCurrency: vi.fn(), updateCurrency: vi.fn(), deleteCurrency: vi.fn() }))
vi.mock("@/models/fields", () => ({ createField: vi.fn(), updateField: vi.fn(), deleteField: vi.fn() }))

import * as actions from "@/app/(app)/settings/actions"
import { getCurrentUser } from "@/lib/auth"
import * as utils from "@/lib/utils"
import * as projects from "@/models/projects"
import * as categories from "@/models/categories"
import * as currencies from "@/models/currencies"
import * as fields from "@/models/fields"
import type { User } from "@/prisma/client"
import { revalidatePath } from "next/cache"

// Ownership fields supplied by a forged request must never reach the model layer.
const input = { name: "Travel", code: "USD", userId: "victim", user: { connect: { id: "victim" } } }
const groups = [
  { name: "project", add: actions.addProjectAction, edit: actions.editProjectAction, remove: actions.deleteProjectAction,
    create: projects.createProject, update: projects.updateProject, delete: projects.deleteProject, path: "/settings/projects" },
  { name: "category", add: actions.addCategoryAction, edit: actions.editCategoryAction, remove: actions.deleteCategoryAction,
    create: categories.createCategory, update: categories.updateCategory, delete: categories.deleteCategory, path: "/settings/categories" },
  { name: "currency", add: actions.addCurrencyAction, edit: actions.editCurrencyAction, remove: actions.deleteCurrencyAction,
    create: currencies.createCurrency, update: currencies.updateCurrency, delete: currencies.deleteCurrency, path: "/settings/currencies" },
  { name: "field", add: actions.addFieldAction, edit: actions.editFieldAction, remove: actions.deleteFieldAction,
    create: fields.createField, update: fields.updateField, delete: fields.deleteField, path: "/settings/fields" },
]
const mutations = groups.flatMap((group) => [group.create, group.update, group.delete])

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "session-user" } as User)
})

describe.each(groups)("$name settings authorization", (group) => {
  const operations = [
    { name: "add", invoke: () => group.add(input), model: group.create, code: undefined },
    { name: "edit", invoke: () => group.edit("travel", input), model: group.update, code: "travel" },
    { name: "delete", invoke: () => group.remove("travel"), model: group.delete, code: "travel" },
  ]

  it.each(operations)("$name uses the session owner and ignores supplied ownership", async ({ invoke, model, code }) => {
    await expect(invoke()).resolves.toMatchObject({ success: true })

    expect(getCurrentUser).toHaveBeenCalledTimes(1)
    expect(model).toHaveBeenCalledTimes(1)
    const args = vi.mocked(model).mock.calls[0]
    expect(args[0]).toBe("session-user")
    if (code) expect(args[1]).toBe(code)
    const data = args.at(-1)
    if (typeof data === "object" && data !== null) {
      expect(data).not.toHaveProperty("userId")
      expect(data).not.toHaveProperty("user")
    }
    expect(revalidatePath).toHaveBeenCalledWith(group.path)
  })

  it.each(operations)("$name propagates authentication redirects before any mutation", async ({ invoke }) => {
    const redirect = new Error("NEXT_REDIRECT")
    vi.mocked(getCurrentUser).mockRejectedValue(redirect)

    await expect(invoke()).rejects.toBe(redirect)

    for (const mutation of mutations) expect(mutation).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe.each([groups[0], groups[1]])("$name creation color", (group) => {
  it("generates a fresh default color for each creation", async () => {
    const randomColor = vi.spyOn(utils, "randomHexColor")
      .mockReturnValueOnce("#112233")
      .mockReturnValueOnce("#445566")

    await group.add(input)
    await group.add(input)

    expect(randomColor).toHaveBeenCalledTimes(2)
    expect(group.create).toHaveBeenNthCalledWith(1, "session-user", expect.objectContaining({ color: "#112233" }))
    expect(group.create).toHaveBeenNthCalledWith(2, "session-user", expect.objectContaining({ color: "#445566" }))
  })

  it("keeps an explicitly selected color", async () => {
    const randomColor = vi.spyOn(utils, "randomHexColor")

    await group.add({ ...input, color: "#abcdef" })

    expect(randomColor).not.toHaveBeenCalled()
    expect(group.create).toHaveBeenCalledWith("session-user", expect.objectContaining({ color: "#abcdef" }))
  })
})
