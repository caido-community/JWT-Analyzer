<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-lg font-semibold text-surface-200">Header & Payload</h2>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fas fa-code text-surface-400"></i>
            <span class="text-sm font-medium text-surface-200">Header</span>
          </div>
          <Button
            icon="fas fa-copy"
            size="small"
            text
            severity="info"
            title="Copy header JSON"
            @click="copyJson(data.header, 'Header')"
          />
        </div>
        <JsonEditor
          :model-value="JSON.stringify(data.header, null, 2)"
          readonly
          min-height="220px"
          max-height="220px"
        />
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fas fa-tag text-surface-400"></i>
            <span class="text-sm font-medium text-surface-200">Payload</span>
          </div>
          <Button
            icon="fas fa-copy"
            size="small"
            text
            severity="info"
            title="Copy payload JSON"
            @click="copyJson(data.payload, 'Payload')"
          />
        </div>
        <JsonEditor
          :model-value="JSON.stringify(data.payload, null, 2)"
          readonly
          min-height="220px"
          max-height="220px"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";

import JsonEditor from "@/components/common/JsonEditor.vue";
import type { TokenDetailsData } from "@/composables/useTokenDetailsState";
import { useSDK } from "@/plugins/sdk";

defineProps<{
  data: TokenDetailsData;
}>();

const sdk = useSDK();

function copyJson(obj: unknown, label: string): void {
  const text = JSON.stringify(obj, null, 2);
  navigator.clipboard
    .writeText(text)
    .then(() => {
      sdk.window.showToast(`${label} copied to clipboard`, {
        variant: "success",
        duration: 2000,
      });
    })
    .catch(() => {
      sdk.window.showToast("Failed to copy", {
        variant: "error",
        duration: 2000,
      });
    });
}
</script>
