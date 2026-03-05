<script setup lang="ts">
import Button from "primevue/button";
import { computed, ref } from "vue";

import { decodeJWT, extractJWTs } from "@/utils/jwt";

defineOptions({ name: "ResponseViewModeContainer" });

const props = defineProps<{
  response: { raw: string };
  request?: { id?: string };
}>();

const raw = computed(() => props.response.raw);
const tokens = computed(() => extractJWTs(raw.value));
const selectedIndex = ref(0);

const decoded = computed(() => {
  const token = tokens.value[selectedIndex.value];
  if (token === undefined || token.length === 0) return undefined;
  return decodeJWT(token);
});

function sendToAnalyzer(token: string): void {
  window.dispatchEvent(
    new CustomEvent("add-token-to-decoder", { detail: { token } }),
  );
  window.location.hash = "/jwt-analyzer";
}

function sendToEditor(token: string): void {
  window.dispatchEvent(
    new CustomEvent("add-token-to-editor", { detail: { token } }),
  );
  window.location.hash = "/jwt-analyzer";
}

async function copyToken(token: string): Promise<void> {
  await navigator.clipboard.writeText(token);
}

function highlightJson(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/"([^"]+)":/g, '<span class="text-blue-300">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="text-emerald-300">"$1"</span>')
    .replace(/: (-?\d+(\.\d+)?)/g, ': <span class="text-amber-300">$1</span>')
    .replace(/: (true|false)/g, ': <span class="text-violet-300">$1</span>')
    .replace(/: null/g, ': <span class="text-surface-400">null</span>');
}
</script>

<template>
  <div class="h-full flex flex-col bg-surface-800 text-surface-100 text-sm">
    <div
      v-if="tokens.length === 0"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center text-surface-500">
        <i class="fas fa-key text-4xl mb-3" />
        <div class="font-semibold">No JWT found in this response</div>
      </div>
    </div>

    <template v-else>
      <div
        v-if="tokens.length > 1"
        class="flex gap-2 p-3 border-b border-surface-700 overflow-x-auto shrink-0"
      >
        <button
          v-for="(_, i) in tokens"
          :key="i"
          class="px-3 py-1 rounded text-xs font-mono border transition-colors"
          :class="{
            'bg-primary-500 border-primary-500 text-white': selectedIndex === i,
            'bg-surface-700 border-surface-600 text-surface-300 hover:bg-surface-600':
              selectedIndex !== i,
          }"
          @click="selectedIndex = i"
        >
          JWT {{ i + 1 }}
        </button>
      </div>

      <div
        class="flex items-center gap-2 p-3 border-b border-surface-700 shrink-0"
      >
        <i class="fas fa-key text-primary-400" />
        <span class="font-semibold">JWT in Response</span>
        <span class="ml-1 text-xs text-surface-400 font-mono">
          {{ decoded?.header?.alg ?? "unknown alg" }}
        </span>
        <div class="ml-auto flex gap-1">
          <Button
            v-tooltip="'Copy token'"
            icon="fas fa-copy"
            size="small"
            text
            severity="secondary"
            @click="copyToken(tokens[selectedIndex] ?? '')"
          />
          <Button
            v-tooltip="'Send to Decoder'"
            icon="fas fa-magnifying-glass"
            size="small"
            text
            severity="info"
            label="Decode"
            @click="sendToAnalyzer(tokens[selectedIndex] ?? '')"
          />
          <Button
            v-tooltip="'Send to Editor'"
            icon="fas fa-code"
            size="small"
            label="Edit"
            @click="sendToEditor(tokens[selectedIndex] ?? '')"
          />
        </div>
      </div>

      <div class="px-3 pt-3 pb-2 shrink-0">
        <p
          class="text-xs text-surface-400 uppercase tracking-wide mb-1 font-mono"
        >
          Raw Token
        </p>
        <div
          class="font-mono text-xs break-all bg-surface-900 rounded p-2 border border-surface-700 text-primary-300 select-all min-h-[2rem]"
        >
          {{ tokens[selectedIndex] }}
        </div>
      </div>

      <div
        v-if="decoded"
        class="flex-1 overflow-auto px-3 pb-3 flex flex-col gap-3"
      >
        <div>
          <p
            class="text-xs text-surface-400 uppercase tracking-wide mb-1 font-mono"
          >
            Header
          </p>
          <pre
            class="text-xs bg-surface-900 rounded p-2 border border-surface-700 overflow-x-auto text-info-300 min-h-[3rem] leading-relaxed"
            v-html="highlightJson(decoded.header)"
          />
        </div>

        <div>
          <p
            class="text-xs text-surface-400 uppercase tracking-wide mb-1 font-mono"
          >
            Payload
          </p>
          <pre
            class="text-xs bg-surface-900 rounded p-2 border border-surface-700 overflow-x-auto text-success-300 min-h-[3rem] leading-relaxed"
            v-html="highlightJson(decoded.payload)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
