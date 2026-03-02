<template>
  <Card
    class="h-full"
    :pt="{
      root: { style: 'display:flex;flex-direction:column;' },
      body: { class: 'flex-1 p-0 flex flex-col min-h-0' },
      content: { class: 'flex-1 flex flex-col min-h-0 overflow-auto' },
    }"
  >
    <template v-if="tab" #header>
      <div class="p-4 border-b border-surface-700 flex flex-col gap-3">
        <!-- Tab name -->
        <div class="flex flex-col gap-0.5 min-w-0">
          <h3 class="text-sm font-semibold font-mono truncate max-w-md">
            {{ tab.name }}
          </h3>
          <p
            v-if="tab.decodedToken"
            class="text-xs text-surface-400 font-mono truncate max-w-md"
          >
            {{ tab.token.substring(0, 55) }}…
          </p>
        </div>

        <!-- Action bar -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center gap-1.5">
            <Button
              label="Decode"
              icon="fas fa-magnifying-glass"
              size="small"
              @click="$emit('decode')"
            />
            <Button
              label="Sign"
              icon="fas fa-signature"
              size="small"
              severity="info"
              outlined
              :disabled="tab.token === ''"
              @click="$emit('sign')"
            />
            <span
              v-if="tab.signatureStale"
              class="text-xs text-amber-400 flex items-center gap-1"
              title="Header or payload was edited; re-sign to produce a valid token"
            >
              <i class="fas fa-exclamation-triangle" />
              Signature stale
            </span>
            <Button
              label="Attack"
              icon="fas fa-bug"
              size="small"
              severity="danger"
              outlined
              :disabled="!tab.decodedToken"
              @click="$emit('attack')"
            />
          </div>
          <div class="flex items-center gap-1.5 ml-auto">
            <Select
              v-model="validationKeyIndex"
              :options="validationKeyOptions"
              option-label="label"
              option-value="value"
              size="small"
              class="min-w-[180px] text-xs"
            />
            <Button
              label="Validate"
              icon="fas fa-shield-halved"
              size="small"
              severity="success"
              outlined
              :disabled="!tab.decodedToken"
              @click="$emit('validate')"
            />
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div v-if="tab" class="flex-1 flex flex-col gap-4 p-4 overflow-auto">
        <!-- JWT raw input -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label
              class="text-xs text-surface-400 uppercase tracking-wide font-mono"
              >Raw JWT Token</label
            >
            <Button
              v-if="tab.token !== ''"
              icon="fas fa-copy"
              size="small"
              text
              severity="info"
              title="Copy raw token"
              @click="copyText(tab.token, 'Token')"
            />
          </div>
          <Textarea
            v-model="tab.token"
            rows="4"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
            class="w-full font-mono text-xs"
            style="resize: vertical; min-height: 80px"
            @input="onTokenInput"
          />
        </div>

        <!-- Decoded JSON editors -->
        <template v-if="tab.decodedToken">
          <div class="grid grid-cols-2 gap-4">
            <!-- Header editor -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <i class="fas fa-code text-surface-400 text-xs"></i>
                  <span class="text-xs font-medium text-surface-200"
                    >Header</span
                  >
                  <span
                    v-if="tab.headerJsonError !== ''"
                    class="text-[10px] px-1.5 rounded bg-danger-500/20 text-danger-400 border border-danger-500/30"
                    >{{ tab.headerJsonError }}</span
                  >
                </div>
                <Button
                  icon="fas fa-copy"
                  size="small"
                  text
                  severity="info"
                  title="Copy header JSON"
                  @click="copyText(tab.headerJson, 'Header')"
                />
              </div>
              <JsonEditor
                v-model="tab.headerJson"
                min-height="260px"
                max-height="260px"
                :has-error="tab.headerJsonError !== ''"
                @update:model-value="validateJson(tab, 'header')"
              />
            </div>

            <!-- Payload editor -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <i class="fas fa-tag text-surface-400 text-xs"></i>
                  <span class="text-xs font-medium text-surface-200"
                    >Payload</span
                  >
                  <span
                    v-if="tab.payloadJsonError !== ''"
                    class="text-[10px] px-1.5 rounded bg-danger-500/20 text-danger-400 border border-danger-500/30"
                    >{{ tab.payloadJsonError }}</span
                  >
                </div>
                <Button
                  icon="fas fa-copy"
                  size="small"
                  text
                  severity="info"
                  title="Copy payload JSON"
                  @click="copyText(tab.payloadJson, 'Payload')"
                />
              </div>
              <JsonEditor
                v-model="tab.payloadJson"
                min-height="260px"
                max-height="260px"
                :has-error="tab.payloadJsonError !== ''"
                @update:model-value="validateJson(tab, 'payload')"
              />
            </div>
          </div>

          <!-- Update token from JSON -->
          <div class="flex justify-end">
            <Button
              label="Update Token from JSON"
              icon="fas fa-arrows-rotate"
              size="small"
              severity="info"
              outlined
              @click="updateToken(tab)"
            />
          </div>
        </template>

        <!-- Empty state -->
        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center gap-2 py-12 text-surface-500"
        >
          <i class="fas fa-pencil-ruler text-3xl"></i>
          <p class="text-sm">
            Paste a JWT token above and click
            <strong class="text-surface-400">Decode</strong>
          </p>
        </div>
      </div>

      <!-- No active tab -->
      <div
        v-else
        class="flex-1 flex flex-col items-center justify-center gap-2 text-surface-500"
      >
        <i class="fas fa-code text-3xl"></i>
        <p class="text-sm">Create a new token tab to get started</p>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Select from "primevue/select";
import Textarea from "primevue/textarea";

import { useKeyManager } from "./useKeyManager";
import { useTokenTabs } from "./useTokenTabs";
import { useValidation } from "./useValidation";

import JsonEditor from "@/components/common/JsonEditor.vue";
import { useSDK } from "@/plugins/sdk";

defineEmits<{
  (e: "decode"): void;
  (e: "sign"): void;
  (e: "attack"): void;
  (e: "validate"): void;
}>();

const sdk = useSDK();
const { activeTab: tab, validateJson, updateToken } = useTokenTabs();
const { keys } = useKeyManager();
const { validationKeyIndex, validationKeyOptions } = useValidation(keys);

function onTokenInput(): void {
  const t = tab.value;
  if (t === undefined) return;
  const parts = t.token.split(".");
  const [p0, p1, p2] = parts;
  if (
    parts.length === 3 &&
    p0 !== undefined &&
    p0 !== "" &&
    p1 !== undefined &&
    p1 !== "" &&
    p2 !== undefined &&
    p2 !== ""
  ) {
    const { decodeTab } = useTokenTabs();
    decodeTab(t);
  }
}

function copyText(text: string, label: string): void {
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
