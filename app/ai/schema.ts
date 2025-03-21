import { Field } from "@prisma/client"

export const fieldsToJsonSchema = (fields: Field[]) => {
  const fieldsWithPrompt = fields.filter((field) => field.llm_prompt)
  const schema = {
    type: "object",
    properties: fieldsWithPrompt.reduce((acc, field) => {
      acc[field.code] = { type: field.type, description: field.llm_prompt || "" }
      return acc
    }, {} as Record<string, { type: string; description: string }>),
    required: fieldsWithPrompt.map((field) => field.code),
    additionalProperties: false,
  }

  return schema
}
