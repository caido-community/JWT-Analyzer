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
        class="px-4 py-3 border-b border-surface-700 flex items-center justify-between"
      >
        <div class="flex flex-col gap-0.5">
          <h3 class="text-sm font-semibold text-surface-100">Quick Attacks</h3>
          <p class="text-xs text-surface-400">Click to open attack panel</p>
        </div>
        <i class="fas fa-bug text-danger-400 text-sm"></i>
      </div>
    </template>

    <template #content>
      <div
        v-if="!hasDecodedToken"
        class="flex-1 flex flex-col items-center justify-center gap-2 p-4 text-center text-surface-500"
      >
        <i class="fas fa-lock text-xl"></i>
        <p class="text-xs">Decode a token first to enable attacks</p>
      </div>

      <div v-else class="flex flex-col gap-1 p-2">
        <button
          v-for="attack in QUICK_ATTACKS"
          :key="attack.value"
          class="flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors bg-surface-700 hover:bg-surface-600 active:bg-surface-800 border border-surface-600/50"
          @click="triggerAttack(attack.value)"
        >
          <i
            class="fas text-xs text-surface-300 shrink-0"
            :class="attack.icon"
          ></i>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-medium text-surface-100 block truncate">{{
              attack.label
            }}</span>
            <span class="text-[10px] text-surface-400 block truncate">{{
              attack.description
            }}</span>
          </div>
          <i
            class="fas fa-chevron-right text-[9px] text-surface-500 shrink-0"
          ></i>
        </button>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import { computed } from "vue";

import { useAttacks } from "./useAttacks";
import { useTokenTabs } from "./useTokenTabs";

const { activeTab } = useTokenTabs();
const { openAttackDialogWithType } = useAttacks();

const hasDecodedToken = computed(
  () => activeTab.value?.decodedToken !== undefined,
);

const QUICK_ATTACKS: {
  label: string;
  value: string;
  description: string;
  icon: string;
}[] = [
  {
    label: "'none' Algorithm",
    value: "none",
    icon: "fa-ban",
    description: "Remove signature, set alg to none",
  },
  {
    label: "HMAC Key Confusion",
    value: "hmac-confusion",
    icon: "fa-shuffle",
    description: "Use public key as HMAC secret",
  },
  {
    label: "Empty Key Signature",
    value: "empty-key",
    icon: "fa-eraser",
    description: "Sign with empty string key",
  },
  {
    label: "Psychic Signature",
    value: "psychic",
    icon: "fa-ghost",
    description: "CVE-2022-21449, ECDSA tokens only",
  },
  {
    label: "Embedded JWK",
    value: "embedded-jwk",
    icon: "fa-key",
    description: "Embed crafted JWK in header",
  },
  {
    label: "Weak HMAC Secret",
    value: "weak-hmac",
    icon: "fa-unlock",
    description: "Sign with common weak secret",
  },
  {
    label: "Algorithm Substitution",
    value: "alg-sub",
    icon: "fa-right-left",
    description: "Swap algorithm header field",
  },
];

function triggerAttack(type: string): void {
  openAttackDialogWithType(
    type as Parameters<typeof openAttackDialogWithType>[0],
  );
}
</script>
