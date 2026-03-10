import { defaultConfig } from "@caido/eslint-config";

/** @type {import('eslint').Linter.Config } */
export default [
  ...defaultConfig(),
  {
    files: [
      "packages/frontend/src/components/RequestViewMode/Container.vue",
      "packages/frontend/src/components/ResponseViewMode/Container.vue",
    ],
    rules: {
      "vue/no-v-html": "off",
    },
  },
];
