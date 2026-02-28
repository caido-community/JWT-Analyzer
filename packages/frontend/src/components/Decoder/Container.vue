<template>
  <div class="h-full flex flex-col gap-1">
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content>
        <div class="p-4 flex justify-between items-center gap-4">
          <div class="flex flex-col gap-0.5">
            <h2 class="text-lg font-semibold">JWT Decoder</h2>
            <p class="text-sm text-surface-300">
              Decode and analyze JWT tokens inline.
            </p>
          </div>
          <div class="flex items-center gap-2 flex-1 max-w-3xl">
            <div class="relative flex-1">
              <InputText
                v-model="manualToken"
                placeholder="Paste a JWT token — eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                class="w-full font-mono text-sm"
                :class="manualToken && !isValidToken ? '!border-red-500' : ''"
                @keydown.enter="decodeManualToken"
              />
              <i
                v-if="manualToken"
                class="pi pi-times absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 text-xs cursor-pointer hover:text-surface-200"
                @click="manualToken = ''"
              />
            </div>
            <Button
              label="Decode"
              icon="pi pi-search"
              size="small"
              :disabled="!isValidToken"
              @mousedown="decodeManualToken"
            />
          </div>
        </div>
      </template>
    </Card>

    <Card
      v-if="decodedTokens.length > 0"
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content>
        <div class="flex gap-2 p-3 overflow-x-auto">
          <TokenTab
            v-for="(token, index) in decodedTokens"
            :key="token.id"
            :label="token.customName || getTabTitle(token)"
            :is-selected="activeTokenTab === index"
            :algorithm="token.header?.alg"
            @select="activeTokenTab = index"
            @close="closeTokenTab(index)"
            @rename="
              (name) => {
                token.customName = name;
              }
            "
          />
        </div>
      </template>
    </Card>

    <!-- Token view: full height, only when a tab is active -->
    <div v-if="decodedTokens.length > 0 && activeToken" class="flex-1 min-h-0">
      <Card
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
            <div class="flex flex-col gap-0.5">
              <h3 class="text-base font-semibold font-mono truncate max-w-lg">
                {{ activeToken.customName || getTabTitle(activeToken) }}
              </h3>
              <p class="text-xs text-surface-400 font-mono truncate max-w-lg">
                {{ activeToken.token.substring(0, 60) }}…
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button
                label="View Details"
                icon="pi pi-list"
                size="small"
                severity="secondary"
                outlined
                @click="onViewDetails(activeToken)"
              />
              <Button
                label="Send to Editor"
                icon="pi pi-pencil"
                size="small"
                severity="info"
                outlined
                @click="onSendToEditor(activeToken)"
              />
            </div>
          </div>
        </template>

        <template #content>
          <div class="flex-1 overflow-auto p-4 flex flex-col gap-4">
            <!-- Header + Payload side by side -->
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <i class="pi pi-code text-surface-400"></i>
                  <span class="text-sm font-medium text-surface-200"
                    >Header</span
                  >
                </div>
                <pre
                  class="bg-surface-900 text-surface-100 p-3 rounded-md font-mono text-xs overflow-auto max-h-56 border border-surface-700 m-0 whitespace-pre-wrap"
                  >{{ JSON.stringify(activeToken.header, null, 2) }}</pre
                >
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <i class="pi pi-tag text-surface-400"></i>
                  <span class="text-sm font-medium text-surface-200"
                    >Payload</span
                  >
                </div>
                <pre
                  class="bg-surface-900 text-surface-100 p-3 rounded-md font-mono text-xs overflow-auto max-h-56 border border-surface-700 m-0 whitespace-pre-wrap"
                  >{{ JSON.stringify(activeToken.payload, null, 2) }}</pre
                >
              </div>
            </div>

            <!-- Security analysis -->
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <i class="pi pi-shield text-surface-400"></i>
                <span class="text-sm font-medium text-surface-200"
                  >Security Analysis</span
                >
                <span
                  v-if="activeToken.analysis?.risks?.length"
                  class="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono"
                >
                  {{ activeToken.analysis.risks.length }} risk{{
                    activeToken.analysis.risks.length !== 1 ? "s" : ""
                  }}
                </span>
                <span
                  v-else
                  class="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30"
                >
                  clean
                </span>
              </div>

              <!-- Risks -->
              <div
                v-if="activeToken.analysis?.risks?.length"
                class="flex flex-col gap-2"
              >
                <div
                  v-for="(risk, i) in activeToken.analysis.risks"
                  :key="i"
                  class="flex items-start gap-3 p-3 rounded-md border"
                  :class="riskRowClass(risk.severity)"
                >
                  <span
                    class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize font-mono"
                    :class="severityBadgeClass(risk.severity)"
                  >
                    {{ risk.severity }}
                  </span>
                  <span class="text-sm text-surface-200">{{
                    risk.description
                  }}</span>
                </div>
              </div>
              <div
                v-else
                class="text-sm text-surface-400 flex items-center gap-2"
              >
                <i class="pi pi-check-circle text-green-500"></i>
                No security risks detected.
              </div>

              <!-- Suggestions -->
              <div
                v-if="activeToken.analysis?.suggestions?.length"
                class="flex flex-col gap-1"
              >
                <span
                  class="text-xs font-medium text-surface-400 uppercase tracking-wide"
                  >Suggestions</span
                >
                <ul class="list-disc list-inside space-y-1">
                  <li
                    v-for="(s, i) in activeToken.analysis.suggestions"
                    :key="i"
                    class="text-sm text-surface-300"
                  >
                    {{ s }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty state when no tokens -->
    <div
      v-if="decodedTokens.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-3 text-surface-400"
    >
      <i class="pi pi-lock-open text-5xl"></i>
      <div class="text-center">
        <p class="font-medium text-surface-300">
          Paste a JWT token above to decode it
        </p>
        <p class="text-sm mt-1">
          The header, payload and security analysis will appear here.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import { computed } from "vue";

import TokenTab from "./TokenTab.vue";
import { useDecoder } from "./useDecoder";
import type { DecodedToken } from "./useDecoder";

import type { JWTHeader, JWTPayload } from "@/types";

const emit = defineEmits<{
  (
    e: "view-details-decoder",
    token: string,
    header: JWTHeader,
    payload: JWTPayload,
    analysis: unknown,
    navigate?: boolean,
  ): void;
  (e: "send-to-editor", token: string): void;
}>();

const {
  manualToken,
  decodedTokens,
  activeTokenTab,
  isValidToken,
  getTabTitle,
  decodeManualToken,
  closeTokenTab,
  viewTokenDetails,
  sendToJWTEditor,
} = useDecoder();

const activeToken = computed<DecodedToken | undefined>(
  () => decodedTokens.value[activeTokenTab.value] ?? undefined,
);

function onViewDetails(token: DecodedToken) {
  viewTokenDetails(token, emit);
}

function onSendToEditor(token: DecodedToken) {
  sendToJWTEditor(token, emit);
}

function riskRowClass(severity: string) {
  switch (severity) {
    case "critical":
      return "border-red-500/30 bg-red-500/10";
    case "high":
      return "border-orange-500/30 bg-orange-500/10";
    case "medium":
      return "border-yellow-500/30 bg-yellow-500/10";
    case "low":
      return "border-blue-500/30 bg-blue-500/10";
    default:
      return "border-surface-700 bg-surface-800";
  }
}

function severityBadgeClass(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "high":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "low":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    default:
      return "bg-surface-700 text-surface-400";
  }
}
</script>
