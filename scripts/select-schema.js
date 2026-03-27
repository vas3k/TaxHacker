#!/usr/bin/env node

/**
 * Database Schema Selector
 *
 * This script selects the appropriate Prisma schema based on the DATABASE_PROVIDER
 * environment variable. It copies the correct schema to prisma/schema.prisma.
 *
 * Usage:
 *   DATABASE_PROVIDER=sqlite node scripts/select-schema.js
 *   DATABASE_PROVIDER=postgresql node scripts/select-schema.js
 *
 * Default: postgresql
 */

import { copyFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, "..")

const provider = process.env.DATABASE_PROVIDER || "postgresql"

const schemaMap = {
  postgresql: "schema.prisma",
  sqlite: "schema.sqlite.prisma",
}

const sourceSchema = schemaMap[provider]

if (!sourceSchema) {
  console.error(`❌ Unknown DATABASE_PROVIDER: ${provider}`)
  console.error(`   Supported providers: ${Object.keys(schemaMap).join(", ")}`)
  process.exit(1)
}

const sourcePath = join(rootDir, "prisma", sourceSchema)
const targetPath = join(rootDir, "prisma", "schema.prisma")

// For PostgreSQL, the schema is already in place
if (provider === "postgresql") {
  console.log(`✅ Using PostgreSQL schema (default)`)
  process.exit(0)
}

// For other providers, copy the appropriate schema
if (!existsSync(sourcePath)) {
  console.error(`❌ Schema file not found: ${sourcePath}`)
  process.exit(1)
}

try {
  copyFileSync(sourcePath, targetPath)
  console.log(`✅ Selected ${provider} schema`)
  console.log(`   Copied ${sourceSchema} → schema.prisma`)
} catch (error) {
  console.error(`❌ Failed to copy schema: ${error.message}`)
  process.exit(1)
}
