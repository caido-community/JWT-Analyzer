<template>
  <div class="h-full flex flex-col gap-1">
    <!-- Title card -->
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content>
        <div class="p-4">
          <h2 class="text-lg font-semibold">Token Details</h2>
          <p class="text-sm text-surface-300">
            Header, payload and security analysis for selected tokens.
          </p>
        </div>
      </template>
    </Card>

    <!-- Tab strip -->
    <Card
      v-if="tokenTabs.length > 0"
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content>
        <div class="flex gap-2 p-3 overflow-x-auto">
          <TokenTab
            v-for="(tab, i) in tokenTabs"
            :key="tab.id"
            :label="tabLabel(tab)"
            :is-selected="activeTabIndex === i"
            :algorithm="tab.header?.alg"
            @select="activeTabIndex = i"
            @close="closeTab(i)"
            @rename="(name) => renameTab(i, name)"
          />
        </div>
      </template>
    </Card>

    <!-- Content card -->
    <div class="flex-1 min-h-0">
      <!-- Empty state -->
      <div
        v-if="tokenTabs.length === 0"
        class="h-full flex flex-col items-center justify-center gap-3 text-surface-400"
      >
        <i class="fas fa-fingerprint text-5xl text-surface-600"></i>
        <p class="font-medium text-surface-300">No token selected</p>
        <p class="text-sm text-center max-w-sm">
          From the Dashboard or Decoder, click "View Details" on any JWT to open
          it here. Up to 10 tabs stay open at once.
        </p>
      </div>

      <Card
        v-else-if="activeTab !== undefined"
        class="h-full"
        :pt="{
          root: { style: 'display: flex; flex-direction: column;' },
          body: { class: 'flex-1 p-0 flex flex-col min-h-0' },
          content: { class: 'flex-1 flex flex-col overflow-auto min-h-0' },
        }"
      >
        <template #header>
          <div
            class="p-4 flex justify-between items-center border-b border-surface-700"
          >
            <div class="flex flex-col gap-0.5 min-w-0">
              <h3 class="text-base font-semibold font-mono truncate max-w-lg">
                {{ activeTab.label ?? tabLabel(activeTab) }}
              </h3>
              <p class="text-xs text-surface-400 font-mono truncate max-w-lg">
                {{ activeTab.token.substring(0, 60) }}…
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Button
                v-tooltip.left="'Copy raw token to clipboard'"
                label="Copy token"
                icon="fas fa-copy"
                size="small"
                severity="success"
                outlined
                @click="handleCopyToken"
              />
              <Button
                v-tooltip.left="'Open in JWT Editor'"
                label="Send to JWT Editor"
                icon="fas fa-pencil"
                size="small"
                severity="secondary"
                @click="handleSendToEditor"
              />
              <SplitButton
                v-tooltip.left="'Export token details'"
                label="Export as Markdown"
                icon="fas fa-file-lines"
                size="small"
                :model="exportItems"
                @click="handleExportMarkdown"
              />
            </div>
          </div>
        </template>

        <template #content>
          <div class="flex-1 overflow-auto p-4 flex flex-col gap-6">
            <HeaderSection :data="activeTab" />
            <PayloadSection :data="activeTab" />
            <RisksSection :data="activeTab" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import SplitButton from "primevue/splitbutton";

import HeaderSection from "./HeaderSection.vue";
import PayloadSection from "./PayloadSection.vue";
import RisksSection from "./RisksSection.vue";
import { useTokenDetails } from "./useTokenDetails";

import TokenTab from "@/components/common/TokenTab.vue";
import type { TokenTab as TokenTabType } from "@/composables/useTokenDetailsState";
import { useTokenDetailsState } from "@/composables/useTokenDetailsState";

const emit = defineEmits<{
  (e: "send-to-editor", token: string): void;
}>();

const { tokenTabs, activeTabIndex, activeTab, closeTab, renameTab } =
  useTokenDetailsState();

const { copyToken, exportAsMarkdown, exportAsJson, downloadBlob } =
  useTokenDetails();

const exportItems = [
  {
    label: "Export as JSON",
    icon: "fas fa-file-code",
    command: () => handleExportJson(),
  },
];

function tabLabel(tab: TokenTabType): string {
  if (tab.label !== undefined && tab.label.length > 0) return tab.label;
  const alg = tab.header?.alg ?? "?";
  const preview =
    tab.token.length > 12 ? `${tab.token.slice(0, 10)}…` : tab.token;
  return `${alg} · ${preview}`;
}

function handleCopyToken(): void {
  if (activeTab.value !== undefined) copyToken(activeTab.value.token);
}

function handleSendToEditor(): void {
  if (activeTab.value !== undefined)
    emit("send-to-editor", activeTab.value.token);
}

function handleExportMarkdown(): void {
  if (activeTab.value === undefined) return;
  const content = exportAsMarkdown(activeTab.value);
  downloadBlob(content, "jwt-token-details.md", "text/markdown");
}

function handleExportJson(): void {
  if (activeTab.value === undefined) return;
  const content = exportAsJson(activeTab.value);
  downloadBlob(content, "jwt-token-details.json", "application/json");
}
</script>
