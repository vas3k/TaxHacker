import { describe, expect, it } from "vitest"
import { categoryFormSchema, projectFormSchema } from "./settings"

describe.each([
  ["category", categoryFormSchema],
  ["project", projectFormSchema],
] as const)("%s form color", (_name, schema) => {
  it("keeps an omitted color absent so updates do not assign a default", () => {
    const result = schema.parse({ name: "Travel" })

    expect(result).not.toHaveProperty("color")
  })

  it.each([null, "", "#ffcb47"])("preserves an explicit color of %j", (color) => {
    expect(schema.parse({ name: "Travel", color }).color).toBe(color)
  })

  it("rejects colors longer than seven characters", () => {
    expect(schema.safeParse({ name: "Travel", color: "#ffcb4700" }).success).toBe(false)
  })
})
