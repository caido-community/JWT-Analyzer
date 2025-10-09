<script setup lang="ts">
import Button from "primevue/button";
import MenuBar from "primevue/menubar";

type PageType = "Dashboard" | "Decoder" | "Token Details" | "JWT Editor" | "Help & Docs";

defineProps<{
  currentPage: PageType;
}>();

defineEmits<{
  (e: "page-change", page: PageType): void;
}>();

const items = [
  {
    label: "Dashboard",
    class: "mx-1",
    page: "Dashboard" as PageType,
    icon: "fas fa-chart-bar"
  },
  {
    label: "JWT Decoder", 
    class: "mx-1",
    page: "Decoder" as PageType,
    icon: "fas fa-eye"
  },
  {
    label: "Token Details",
    class: "mx-1", 
    page: "Token Details" as PageType,
    icon: "fas fa-key"
  },
  {
    label: "JWT Editor",
    class: "mx-1",
    page: "JWT Editor" as PageType,
    icon: "fas fa-code"
  },
  {
    label: "Help & Docs",
    class: "mx-1",
    page: "Help & Docs" as PageType,
    icon: "fas fa-question-circle"
  },
];

// Handle PrimeVue label type issue
const handleLabel = (
  label: string | ((...args: unknown[]) => string) | undefined,
) => {
  if (typeof label === "function") {
    return label();
  }
  return label;
};
</script>

<template>
  <MenuBar :model="items" class="h-12 gap-2">
    <template #start>
      <div class="px-2 font-bold">JWT Analyzer</div>
    </template>

    <template #item="{ item }">
      <Button
        :severity="currentPage === item.page ? 'secondary' : 'contrast'"
        :outlined="currentPage === item.page"
        size="small"
        :text="currentPage !== item.page"
        @mousedown="$emit('page-change', item.page)"
      >
        <i :class="item.icon" class="mr-2"></i>
        {{ handleLabel(item.label) }}
      </Button>
    </template>
  </MenuBar>
</template>
