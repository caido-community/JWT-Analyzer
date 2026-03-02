<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Algorithm -->
    <div
      class="bg-surface-800 border border-surface-700 rounded p-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <i class="fas fa-shield-halved text-surface-400 text-sm"></i>
        <span class="font-medium text-xs text-surface-300">Algorithm</span>
      </div>
      <span class="text-xs font-mono font-semibold" :class="algClass">
        {{ data.header?.alg ?? "-" }}
      </span>
    </div>

    <!-- Issuer -->
    <div
      class="bg-surface-800 border border-surface-700 rounded p-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <i class="fas fa-building text-surface-400 text-sm"></i>
        <span class="font-medium text-xs text-surface-300">Issuer</span>
      </div>
      <span
        class="text-xs font-mono text-surface-200 truncate max-w-[140px]"
        :title="issuer"
      >
        {{ issuer }}
      </span>
    </div>

    <!-- Expiration -->
    <div
      class="bg-surface-800 border border-surface-700 rounded p-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <i class="fas fa-clock text-surface-400 text-sm"></i>
        <span class="font-medium text-xs text-surface-300">Expiration</span>
      </div>
      <span class="text-xs font-semibold" :class="expClass">
        {{ expLabel }}
      </span>
    </div>

    <!-- Source -->
    <div
      class="bg-surface-800 border border-surface-700 rounded p-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <i class="fas fa-globe text-surface-400 text-sm"></i>
        <span class="font-medium text-xs text-surface-300">Source</span>
      </div>
      <span class="text-xs text-surface-200 capitalize">
        {{ data.source ?? "-" }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { TokenDetailsData } from "@/composables/useTokenDetailsState";

const props = defineProps<{ data: TokenDetailsData }>();

const algClass = computed(() => {
  const alg = props.data.header?.alg ?? "";
  if (alg === "none") return "text-danger-400";
  if (alg.startsWith("HS")) return "text-info-300";
  if (alg.startsWith("RS") || alg.startsWith("PS")) return "text-secondary-300";
  if (alg.startsWith("ES")) return "text-success-300";
  return "text-surface-200";
});

const issuer = computed(() => {
  const v = props.data.issuer ?? props.data.payload?.iss;
  return typeof v === "string" && v.length > 0 ? v : "-";
});

const expClass = computed(() => {
  if (props.data.expStatus === "expired") return "text-danger-400";
  if (props.data.expStatus === "not_yet_valid") return "text-secondary-400";
  if (props.data.payload?.exp !== undefined) return "text-success-400";
  return "text-surface-400";
});

const expLabel = computed(() => {
  if (props.data.timeLeft !== undefined && props.data.timeLeft.length > 0)
    return props.data.timeLeft;
  if (props.data.payload?.exp !== undefined)
    return props.data.expStatus === "expired" ? "Expired" : "Valid";
  return "No expiration";
});
</script>
