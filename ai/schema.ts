import { Field } from "@/prisma/client"

export const fieldsToJsonSchema = (fields: Field[]) => {
  const fieldsWithPrompt = fields.filter((field) => field.llm_prompt)
  const schemaProperties = fieldsWithPrompt.reduce(
    (acc, field) => {
      acc[field.code] = { type: field.type, description: field.llm_prompt || "" }
      return acc
    },
    {} as Record<string, { type: string; description: string }>
  )

  const schema = {
    type: "object",
    properties: {
      ...schemaProperties,
      items: {
        type: "array",
        description: "Separate items, products or transactions in the file which have own name and price or sum. Find all items!",
        items: {
          type: "object",
          properties: schemaProperties,
          required: [...Object.keys(schemaProperties)],
          additionalProperties: false,
        },
      },
    },
    required: [...Object.keys(schemaProperties), "items"],
    additionalProperties: false,
  }

  return schema
}
