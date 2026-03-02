<template>
  <div class="px-6 py-3 flex items-center gap-6 bg-surface-800/40">
    <div class="flex items-center gap-x-5 gap-y-1 flex-1 flex-wrap text-xs">
      <span class="flex items-center gap-1">
        <span
          class="text-surface-500 uppercase tracking-wide text-[10px] font-medium"
          >Alg</span
        >
        <span class="font-mono text-surface-100 font-semibold">
          {{ finding.metadata?.header?.alg ?? "-" }}
        </span>
      </span>
      <span class="text-surface-700">·</span>
      <span class="flex items-center gap-1">
        <span
          class="text-surface-500 uppercase tracking-wide text-[10px] font-medium"
          >Issuer</span
        >
        <span class="text-surface-100">{{
          finding.metadata?.issuer ?? "-"
        }}</span>
      </span>
      <span class="text-surface-700">·</span>
      <span class="flex items-center gap-1">
        <span
          class="text-surface-500 uppercase tracking-wide text-[10px] font-medium"
          >Subject</span
        >
        <span class="text-surface-100">{{
          finding.metadata?.subject ?? "-"
        }}</span>
      </span>
      <span class="text-surface-700">·</span>
      <span class="flex items-center gap-1">
        <span
          class="text-surface-500 uppercase tracking-wide text-[10px] font-medium"
          >Exp</span
        >
        <span
          :class="
            finding.metadata?.expStatus === 'expired'
              ? 'text-red-400 font-medium'
              : 'text-surface-100'
          "
        >
          {{ finding.metadata?.timeLeft ?? "-" }}
        </span>
      </span>
      <template v-if="finding.metadata?.audience">
        <span class="text-surface-700">·</span>
        <span class="flex items-center gap-1">
          <span
            class="text-surface-500 uppercase tracking-wide text-[10px] font-medium"
            >Aud</span
          >
          <span class="text-surface-100">{{ finding.metadata.audience }}</span>
        </span>
      </template>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      <Button
        icon="fas fa-key"
        label="Decode"
        size="small"
        severity="info"
        outlined
        @click="$emit('decode', finding)"
      />
      <Button
        icon="fas fa-list"
        label="Details"
        size="small"
        severity="success"
        outlined
        @click="$emit('view-details', finding)"
      />
      <Button
        icon="fas fa-pencil"
        label="Editor"
        size="small"
        severity="info"
        outlined
        @click="$emit('send-to-editor', finding)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import type { Finding } from "shared";

defineProps<{
  finding: Finding;
}>();

defineEmits<{
  (e: "decode", finding: Finding): void;
  (e: "view-details", finding: Finding): void;
  (e: "send-to-editor", finding: Finding): void;
}>();
</script>
