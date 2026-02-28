<template>
  <div class="h-full p-4 overflow-y-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <Card
        class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg"
        :pt="{ root: { class: 'rounded-lg' } }"
      >
        <template #title>
          <div class="flex items-center">
            <span class="inline-flex mr-2 w-5 h-5 items-center justify-center">
              <i class="pi pi-code"></i>
            </span>
            <span>Header</span>
          </div>
        </template>
        <template #content>
          <pre
            class="bg-surface-800 text-white p-3 rounded font-mono text-sm overflow-auto max-h-64 m-0"
            >{{ JSON.stringify(token.header, null, 2) }}</pre
          >
        </template>
      </Card>
      <Card
        class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg"
        :pt="{ root: { class: 'rounded-lg' } }"
      >
        <template #title>
          <div class="flex items-center">
            <span class="inline-flex mr-2 w-5 h-5 items-center justify-center">
              <i class="pi pi-tag"></i>
            </span>
            <span>Payload</span>
          </div>
        </template>
        <template #content>
          <pre
            class="bg-surface-800 text-white p-3 rounded font-mono text-sm overflow-auto max-h-64 m-0"
            >{{ JSON.stringify(token.payload, null, 2) }}</pre
          >
        </template>
      </Card>
    </div>

    <Card
      class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg"
      :pt="{ root: { class: 'rounded-lg' } }"
    >
      <template #title>
        <div class="flex items-center">
          <span class="inline-flex mr-2 w-5 h-5 items-center justify-center">
            <i class="pi pi-shield"></i>
          </span>
          <span>Security Analysis</span>
        </div>
      </template>
      <template #content>
        <div v-if="token.analysis">
          <h3 class="text-sm font-semibold mb-2">Risks</h3>
          <div
            v-if="!token.analysis.risks || token.analysis.risks.length === 0"
            class="py-2 text-center text-surface-500"
          >
            <i class="pi pi-check-circle text-green-500"></i>
            No risks detected
          </div>
          <ul v-else class="space-y-2 mb-4">
            <li
              v-for="(risk, riskIndex) in token.analysis.risks"
              :key="riskIndex"
              class="border-l-4 p-2 rounded"
              :class="{
                'border-red-500 bg-red-200 dark:bg-red-700/40':
                  risk.severity === 'critical',
                'border-orange-500 bg-orange-200 dark:bg-orange-700/40':
                  risk.severity === 'high',
                'border-yellow-500 bg-yellow-200 dark:bg-yellow-700/40':
                  risk.severity === 'medium',
                'border-blue-500 bg-blue-200 dark:bg-blue-700/40':
                  risk.severity === 'low',
              }"
            >
              <div class="flex items-start">
                <Tag
                  :value="risk.severity"
                  :severity="getSeverityType(risk.severity)"
                  class="mr-2"
                />
                <span>{{ risk.description }}</span>
              </div>
            </li>
          </ul>
          <h3 class="text-sm font-semibold mb-2">Suggestions</h3>
          <div
            v-if="
              !token.analysis.suggestions ||
              token.analysis.suggestions.length === 0
            "
            class="py-2 text-center text-surface-500"
          >
            No suggestions available
          </div>
          <ul v-else class="list-disc ml-5 space-y-1">
            <li
              v-for="(suggestion, sugIndex) in token.analysis.suggestions"
              :key="sugIndex"
            >
              {{ suggestion }}
            </li>
          </ul>
        </div>
        <div class="flex justify-end mt-4 gap-2">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            aria-label="Rename Tab"
            @click="$emit('rename', tabIndex)"
          />
          <Button
            label="View in Token Details"
            severity="success"
            icon="pi pi-external-link"
            @click="$emit('view-details', token)"
          />
          <Button
            label="Send to JWT Editor"
            severity="info"
            icon="pi pi-pencil"
            @click="$emit('send-to-editor', token)"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Tag from "primevue/tag";

import type { DecodedToken } from "./useDecoder";

defineProps<{
  token: DecodedToken;
  tabIndex: number;
  getSeverityType: (severity: string) => "danger" | "warning" | "info";
}>();

defineEmits<{
  (e: "rename", index: number): void;
  (e: "view-details", token: DecodedToken): void;
  (e: "send-to-editor", token: DecodedToken): void;
}>();
</script>
