<template>
  <div
    @dblclick="startEdit"
    @contextmenu.prevent="contextMenuRef?.show($event)"
  >
    <Button
      :class="[
        isSelected ? '!border-secondary-400' : '!border-surface-700',
        '!bg-surface-900 border-[1px] rounded !ring-0',
      ]"
      severity="contrast"
      size="small"
      outlined
      @mousedown="$emit('select')"
    >
      <div class="flex items-center gap-2 max-w-[200px]">
        <span v-if="$slots.leading" class="shrink-0">
          <slot name="leading" />
        </span>
        <span
          v-else
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :class="algDotClass"
        />
        <template v-if="isEditing">
          <div class="relative">
            <span class="invisible px-1 whitespace-nowrap text-xs">{{
              editValue
            }}</span>
            <input
              ref="inputRef"
              v-model="editValue"
              type="text"
              autocomplete="off"
              class="absolute top-0 left-0 w-full h-full px-1 text-xs focus:outline outline-1 outline-secondary-400 rounded bg-surface-900 overflow-hidden text-ellipsis"
              @focusout="submitEdit"
              @keydown.enter.prevent="submitEdit"
              @keydown.escape.prevent="cancelEdit"
            />
          </div>
        </template>
        <span v-else class="px-1 whitespace-nowrap text-xs truncate">{{
          label
        }}</span>
        <button
          type="button"
          class="text-surface-500 hover:text-surface-300 transition-colors shrink-0 ml-1"
          @mousedown.stop="$emit('close')"
        >
          <i class="fas fa-times text-[10px]"></i>
        </button>
      </div>
    </Button>
    <ContextMenu ref="contextMenuRef" :model="contextMenuItems" />
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import ContextMenu from "primevue/contextmenu";
import { computed, nextTick, ref } from "vue";

const props = defineProps<{
  label: string;
  isSelected: boolean;
  algorithm?: string;
}>();

const emit = defineEmits<{
  (e: "select"): void;
  (e: "close"): void;
  (e: "rename", name: string): void;
}>();

const contextMenuRef = ref<InstanceType<typeof ContextMenu> | undefined>(
  undefined,
);
const isEditing = ref(false);
const editValue = ref("");
const inputRef = ref<HTMLInputElement | undefined>(undefined);

const algDotClass = computed(() => {
  const alg = props.algorithm ?? "";
  if (alg === "none") return "bg-red-500";
  if (alg.startsWith("HS")) return "bg-blue-400";
  if (alg.startsWith("RS") || alg.startsWith("PS")) return "bg-purple-400";
  if (alg.startsWith("ES")) return "bg-green-400";
  return "bg-surface-500";
});

const contextMenuItems = [
  { label: "Rename", icon: "fas fa-pencil", command: () => startEdit() },
  { label: "Close", icon: "fas fa-times", command: () => emit("close") },
];

function startEdit(): void {
  editValue.value = props.label;
  isEditing.value = true;
  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
}

function submitEdit(): void {
  if (editValue.value.trim() !== "" && editValue.value !== props.label) {
    emit("rename", editValue.value.trim());
  }
  isEditing.value = false;
}

function cancelEdit(): void {
  isEditing.value = false;
}
</script>
