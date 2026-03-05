import type { RawConfigurationOrFn } from "knip/dist/types/config.js";

const config: RawConfigurationOrFn = {
  workspaces: {
    ".": {
      entry: ["caido.config.ts", "eslint.config.mjs"],
    },
    "packages/frontend": {
      entry: ["src/index.ts"],
      project: ["src/**/*.{ts,tsx,vue}"],
      ignoreDependencies: ["@fortawesome/fontawesome-free"],
    },
    "packages/shared": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts"],
    },
  },
};

export default config;

