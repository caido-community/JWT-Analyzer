<template>
  <Card
    class="h-full"
    :pt="{
      root: { style: 'display:flex;flex-direction:column;' },
      body: { class: 'flex-1 p-0 flex flex-col min-h-0' },
      content: { class: 'flex-1 flex flex-col min-h-0 overflow-auto' },
    }"
  >
    <template #header>
      <div
        class="p-4 border-b border-surface-700 flex justify-between items-center"
      >
        <div class="flex flex-col gap-0.5">
          <h3 class="text-sm font-semibold text-surface-100">Key Manager</h3>
          <p class="text-xs text-surface-400">
            Saved signing/verification keys
          </p>
        </div>
        <Button
          label="Add Key"
          icon="fas fa-plus"
          size="small"
          @click="openNewKeyDialog"
        />
      </div>
    </template>

    <template #content>
      <!-- Empty state -->
      <div
        v-if="keys.length === 0"
        class="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-surface-500"
      >
        <i class="fas fa-key text-3xl"></i>
        <p class="text-sm">No keys saved yet.</p>
        <p class="text-xs">
          Click <strong class="text-surface-400">Add Key</strong> to create one.
        </p>
      </div>

      <!-- Key list -->
      <div v-else class="flex flex-col divide-y divide-surface-800">
        <div
          v-for="(key, index) in keys"
          :key="key.id"
          class="flex items-center gap-3 p-3 hover:bg-surface-800/40 transition-colors"
        >
          <!-- Icon -->
          <div class="shrink-0">
            <i
              class="fas text-sm"
              :class="{
                'fa-key text-secondary-400': key.type === 'symmetric',
                'fa-lock text-info-400': key.type !== 'symmetric',
              }"
            ></i>
          </div>

          <!-- Key info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="text-sm font-mono font-medium text-surface-100 truncate"
                >{{ key.id }}</span
              >
              <span
                class="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-mono border"
                :class="algBadgeClass(key.algorithm)"
                >{{ key.algorithm }}</span
              >
            </div>
            <p class="text-xs text-surface-500 mt-0.5">
              {{
                key.type === "symmetric"
                  ? "Symmetric (HMAC)"
                  : "Asymmetric (RSA/EC)"
              }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <Button
              icon="fas fa-pencil"
              size="small"
              text
              severity="info"
              title="Edit key"
              @click="editKey(index)"
            />
            <Button
              icon="fas fa-trash"
              size="small"
              text
              severity="danger"
              title="Delete key"
              @click="deleteKey(index)"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";

import { useKeyManager } from "./useKeyManager";

const { keys, openNewKeyDialog, editKey, deleteKey } = useKeyManager();

function algBadgeClass(alg: string): string {
  if (alg.startsWith("HS"))
    return "bg-secondary-500/20 text-secondary-300 border-secondary-500/30";
  if (alg.startsWith("RS") || alg.startsWith("PS"))
    return "bg-info-500/20 text-info-300 border-info-500/30";
  if (alg.startsWith("ES"))
    return "bg-success-500/20 text-success-300 border-success-500/30";
  return "bg-surface-700 text-surface-400 border-surface-600";
}
</script>
