<template>
  <div class="p-4 pb-2">
    <Card
      class="bg-gray-50 dark:bg-surface-700"
      :pt="{ body: { class: 'p-0' }, content: { class: 'flex flex-col' } }"
    >
      <template #title>
        <div class="flex items-center px-4 py-2">
          <span class="inline-flex mr-3 w-5 h-5 items-center justify-center">
            <i class="pi pi-lock-open text-base"></i>
          </span>
          <span class="text-base">Decode JWT Token</span>
        </div>
      </template>
      <template #content>
        <div class="p-4">
          <label for="jwt-input" class="block text-sm font-medium mb-2">
            Enter JWT Token
          </label>
          <div class="flex gap-2">
            <InputText
              id="jwt-input"
              :model-value="modelValue"
              class="flex-1"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              @update:model-value="$emit('update:modelValue', $event)"
              @keydown.enter="decode"
            />
            <Button
              icon="pi pi-search"
              label="Decode"
              :disabled="!isValid"
              @click="decode"
            />
          </div>
          <small v-if="modelValue && !isValid" class="text-red-500 mt-1 block">
            Invalid JWT format. Please enter a valid token.
          </small>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";

defineProps<{
  modelValue: string;
  isValid: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "decode"): void;
}>();

function decode() {
  emit("decode");
}
</script>
