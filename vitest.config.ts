import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      shared: path.resolve(__dirname, "packages/shared/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/src/**/*.spec.ts", "packages/**/src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
