<template>
  <Dialog
    v-model:visible="showKeyDialog"
    :header="editingIndex === -1 ? 'Add Key' : 'Edit Key'"
    modal
    class="w-[36rem]"
    :pt="dialogPt"
  >
    <div class="flex flex-col gap-1">
      <label class="text-xs text-surface-400 uppercase tracking-wide"
        >Key ID *</label
      >
      <InputText
        v-model="keyForm.id"
        placeholder="e.g. my-hs256-key"
        class="w-full"
      />
    </div>

    <div class="flex gap-3">
      <div class="flex flex-col gap-1 flex-1">
        <label class="text-xs text-surface-400 uppercase tracking-wide"
          >Type</label
        >
        <Select
          v-model="keyForm.type"
          :options="KEY_TYPE_OPTIONS"
          option-label="label"
          option-value="value"
          class="w-full"
          @change="onTypeChange"
        />
      </div>
      <div class="flex flex-col gap-1 flex-1">
        <label class="text-xs text-surface-400 uppercase tracking-wide"
          >Algorithm</label
        >
        <Select
          v-model="keyForm.algorithm"
          :options="algOptions"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>
    </div>

    <!-- Symmetric: secret value -->
    <div v-if="keyForm.type === 'symmetric'" class="flex flex-col gap-1">
      <div class="flex justify-between items-center">
        <label class="text-xs text-surface-400 uppercase tracking-wide"
          >Secret</label
        >
        <div class="flex gap-1">
          <Button
            label="Generate"
            icon="fas fa-rotate"
            size="small"
            severity="info"
            outlined
            @click="generateRandomKey"
          />
          <Button
            :icon="showKeyValue ? 'fas fa-eye-slash' : 'fas fa-eye'"
            size="small"
            text
            @click="showKeyValue = !showKeyValue"
          />
        </div>
      </div>
      <InputText
        v-model="keyForm.value"
        :type="showKeyValue ? 'text' : 'password'"
        placeholder="Hex-encoded or plain-text secret"
        class="w-full font-mono text-sm"
      />
    </div>

    <!-- Asymmetric: public + private keys -->
    <template v-else>
      <div class="flex justify-end">
        <Button
          label="Generate Key Pair"
          icon="fas fa-key"
          size="small"
          severity="info"
          outlined
          @click="generateKeyPair"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-surface-400 uppercase tracking-wide"
          >Public Key (PEM)</label
        >
        <Textarea
          v-model="keyForm.publicKey"
          rows="4"
          placeholder="-----BEGIN PUBLIC KEY-----"
          class="w-full font-mono text-xs"
        />
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex justify-between items-center">
          <label class="text-xs text-surface-400 uppercase tracking-wide"
            >Private Key (PEM)</label
          >
          <Button
            :icon="showPrivateKey ? 'fas fa-eye-slash' : 'fas fa-eye'"
            size="small"
            text
            @click="showPrivateKey = !showPrivateKey"
          />
        </div>
        <div class="relative">
          <Textarea
            v-model="keyForm.privateKey"
            rows="4"
            placeholder="-----BEGIN PRIVATE KEY-----"
            class="w-full font-mono text-xs transition-all"
            :style="
              !showPrivateKey ? { filter: 'blur(3px)', userSelect: 'none' } : {}
            "
          />
          <div
            v-if="!showPrivateKey && keyForm.privateKey !== ''"
            class="absolute inset-0 cursor-pointer flex items-center justify-center"
            @click="showPrivateKey = true"
          >
            <span
              class="text-xs text-surface-400 bg-surface-900/80 px-2 py-1 rounded"
              >Click eye to reveal</span
            >
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <Button
        label="Cancel"
        severity="info"
        outlined
        size="small"
        @click="showKeyDialog = false"
      />
      <Button
        label="Save Key"
        icon="fas fa-floppy-disk"
        size="small"
        @click="saveKey"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import { computed } from "vue";

import {
  ASYMMETRIC_ALG_OPTIONS,
  KEY_TYPE_OPTIONS,
  SYMMETRIC_ALG_OPTIONS,
  useKeyManager,
} from "./useKeyManager";

import { dialogPt } from "@/utils/dialogPt";

const {
  showKeyDialog,
  editingIndex,
  keyForm,
  showKeyValue,
  showPrivateKey,
  generateRandomKey,
  generateKeyPair,
  saveKey,
} = useKeyManager();

const algOptions = computed(() =>
  keyForm.value.type === "symmetric"
    ? SYMMETRIC_ALG_OPTIONS
    : ASYMMETRIC_ALG_OPTIONS,
);

function onTypeChange(): void {
  keyForm.value.algorithm =
    keyForm.value.type === "symmetric" ? "HS256" : "RS256";
  keyForm.value.value = "";
  keyForm.value.publicKey = "";
  keyForm.value.privateKey = "";
}
</script>
