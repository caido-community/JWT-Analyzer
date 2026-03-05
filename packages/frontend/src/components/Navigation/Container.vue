<script setup lang="ts">
import Button from "primevue/button";
import MenuBar from "primevue/menubar";

import type { PageType } from "@/composables/useNavigation";

defineOptions({ name: "NavigationContainer" });

const props = defineProps<{
  currentPage: PageType;
}>();

const emit = defineEmits<{
  (e: "page-change", page: PageType): void;
}>();

const items: { label: string; page: PageType; icon: string }[] = [
  { label: "Dashboard", page: "Dashboard", icon: "fas fa-chart-bar" },
  { label: "JWT Decoder", page: "Decoder", icon: "fas fa-eye" },
  { label: "Token Details", page: "Token Details", icon: "fas fa-key" },
  { label: "JWT Editor", page: "JWT Editor", icon: "fas fa-code" },
  { label: "Help & Docs", page: "Help & Docs", icon: "fas fa-question-circle" },
];
</script>

<template>
  <MenuBar :model="items" class="h-12 gap-2">
    <template #start>
      <div class="px-2 font-bold text-surface-200">JWT Analyzer</div>
    </template>
    <template #item="{ item }">
      <Button
        :severity="props.currentPage === item.page ? 'secondary' : 'contrast'"
        :outlined="props.currentPage === item.page"
        size="small"
        :text="props.currentPage !== item.page"
        @mousedown="emit('page-change', item.page)"
      >
        <i :class="item.icon" class="mr-2"></i>
        {{ item.label }}
      </Button>
    </template>
  </MenuBar>
</template>
