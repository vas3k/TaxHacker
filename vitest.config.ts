import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "forms/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@/prisma/client": path.resolve(__dirname, "prisma/client/client.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
})
