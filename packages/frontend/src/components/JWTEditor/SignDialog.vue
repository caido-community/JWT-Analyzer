<template>
  <Dialog
    v-model:visible="showSignDialog"
    header="Sign Token"
    modal
    class="w-[34rem]"
    :pt="dialogPt"
  >
    <div
      class="flex items-center gap-3 p-3 rounded border border-surface-700 bg-surface-800/50"
    >
      <i class="fas fa-circle-info text-info-400 text-sm"></i>
      <p class="text-sm text-surface-300">
        Select a saved key or enter a temporary key below. The token will be
        re-signed with the chosen algorithm.
      </p>
    </div>

    <!-- Use saved key toggle -->
    <div class="flex items-center gap-2">
      <ToggleSwitch v-model="useTempKey" />
      <span class="text-sm text-surface-300"
        >Use temporary key (not saved)</span
      >
    </div>

    <!-- Saved key select -->
    <div v-if="!useTempKey" class="flex flex-col gap-1">
      <label class="text-xs text-surface-400 uppercase tracking-wide"
        >Saved Key</label
      >
      <Select
        v-model="selectedKeyIndex"
        :options="keyOptions"
        option-label="label"
        option-value="value"
        class="w-full"
        :placeholder="
          keyOptions.length <= 1
            ? 'No keys saved - add one in Key Manager'
            : 'Select a key'
        "
      />
    </div>

    <!-- Temp key inputs -->
    <template v-else>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-surface-400 uppercase tracking-wide"
          >Algorithm</label
        >
        <Select
          v-model="tempKeyAlgorithm"
          :options="SIGNING_ALG_OPTIONS"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-surface-400 uppercase tracking-wide">
          {{
            tempKeyAlgorithm.startsWith("HS")
              ? "HMAC Secret"
              : "Private Key (PEM)"
          }}
        </label>
        <Textarea
          v-model="tempKeyValue"
          rows="5"
          :placeholder="
            tempKeyAlgorithm.startsWith('HS')
              ? 'Enter secret...'
              : '-----BEGIN PRIVATE KEY-----'
          "
          class="w-full font-mono text-xs"
        />
      </div>
    </template>

    <template #footer>
      <Button
        label="Cancel"
        severity="info"
        outlined
        size="small"
        @click="showSignDialog = false"
      />
      <Button
        label="Sign Token"
        icon="fas fa-signature"
        size="small"
        @click="$emit('sign')"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";

import { useKeyManager } from "./useKeyManager";
import { SIGNING_ALG_OPTIONS, useSigning } from "./useSigning";

import { dialogPt } from "@/utils/dialogPt";

defineEmits<{ (e: "sign"): void }>();

const { keys } = useKeyManager();
const {
  showSignDialog,
  selectedKeyIndex,
  tempKeyValue,
  tempKeyAlgorithm,
  useTempKey,
  keyOptions,
} = useSigning(keys);
</script>
