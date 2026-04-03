export type ProjectMappingChoice =
  | { mode: "existing"; code: string }
  | { mode: "new"; name: string }

export type ProjectMappingsInput = Record<string, ProjectMappingChoice>
