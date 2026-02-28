<template>
  <div class="h-full flex flex-col gap-1">
    <!-- Main card: header with title + description + search + actions, content is the table -->
    <Card
      class="h-full"
      :pt="{
        root: { style: 'display: flex; flex-direction: column;' },
        body: { class: 'flex-1 p-0 flex flex-col min-h-0' },
        content: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
      }"
    >
      <template #header>
        <div class="p-4 flex justify-between items-center gap-4 flex-wrap">
          <!-- Title + description -->
          <div class="flex flex-col gap-0.5">
            <h2 class="text-lg font-semibold">Dashboard</h2>
            <p class="text-sm text-surface-300">
              Captured JWT tokens and their security analysis.
            </p>
          </div>

          <!-- Actions: search + filter + refresh -->
          <div class="flex items-center gap-2 flex-1 justify-end">
            <!-- Inline search -->
            <div class="relative min-w-[18em]">
              <InputText
                v-model="localSearch"
                placeholder="Search tokens, payloads…"
                class="w-full pr-7"
                @input="onSearchInput"
              />
              <i
                v-if="localSearch"
                class="pi pi-times absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 text-xs cursor-pointer hover:text-surface-200"
                @click="clearSearch"
              />
            </div>

            <!-- Severity filter: SelectButton (same pattern as scanner plugin) -->
            <SelectButton
              v-model="selectedSeveritiesLocal"
              :options="severityOptions"
              option-label="label"
              option-value="value"
              multiple
              :allow-empty="true"
              :pt="{
                root: { style: 'border-color: var(--p-surface-700)' },
              }"
            />

            <Button
              v-tooltip="'Refresh findings'"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :loading="isLoading"
              @click="onRefresh"
            />
            <Button
              v-if="findings.length > 0"
              icon="pi pi-trash"
              severity="danger"
              outlined
              label="Clear All"
              @click="onClearAll"
            />
          </div>
        </div>
      </template>

      <template #content>
        <!-- Empty state -->
        <div
          v-if="findings.length === 0"
          class="flex-1 flex flex-col items-center justify-center gap-3 text-surface-400"
        >
          <i class="pi pi-inbox text-5xl"></i>
          <div class="text-center">
            <p class="font-medium text-surface-300">No JWT findings yet</p>
            <p class="text-sm mt-1">
              Browse traffic — tokens are detected automatically.
            </p>
          </div>
        </div>

        <!-- Filter empty state -->
        <div
          v-else-if="filteredFindings.length === 0"
          class="flex-1 flex flex-col items-center justify-center gap-3 text-surface-400"
        >
          <i class="pi pi-filter-slash text-4xl"></i>
          <p class="text-sm">No findings match your filters.</p>
        </div>

        <!-- Table -->
        <DataTable
          v-else
          v-model:expanded-rows="expandedRows"
          :value="filteredFindings"
          scrollable
          scroll-height="flex"
          striped-rows
          size="small"
          row-hover
          :row-class="rowClass"
          class="min-h-0"
          removable-sort
          @row-click="onRowClick"
          @row-toggle="onRowToggle"
        >
          <Column expander style="width: 2.5rem" />
          <Column header="Token" style="width: 30%">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <span
                  class="font-mono text-xs text-surface-200 truncate max-w-[200px]"
                >
                  {{ formatTokenPreview(data.metadata?.token ?? "") }}
                </span>
                <button
                  class="text-surface-500 hover:text-surface-200 transition-colors shrink-0"
                  title="Copy token"
                  @click.stop="copyTokenToClipboard(data.metadata?.token ?? '')"
                >
                  <i class="pi pi-copy text-xs"></i>
                </button>
              </div>
            </template>
          </Column>
          <Column
            field="severity"
            header="Severity"
            sortable
            style="width: 9rem"
          >
            <template #body="{ data }">
              <span :class="severityBadgeClass(data.severity)">
                {{ data.severity }}
              </span>
            </template>
          </Column>
          <Column
            field="metadata.header.alg"
            header="Algorithm"
            sortable
            style="width: 8rem"
          >
            <template #body="{ data }">
              <span class="font-mono text-xs text-surface-300">
                {{ data.metadata?.header?.alg ?? "—" }}
              </span>
            </template>
          </Column>
          <Column
            field="metadata.source"
            header="Source"
            sortable
            style="width: 7rem"
          >
            <template #body="{ data }">
              <span :class="sourceBadgeClass(data.metadata?.source)">
                {{ data.metadata?.source ?? "unknown" }}
              </span>
            </template>
          </Column>
          <Column
            field="metadata.timeLeft"
            header="Expiration"
            sortable
            style="width: 10rem"
          >
            <template #body="{ data }">
              <span
                class="text-xs"
                :class="
                  data.metadata?.expStatus === 'expired'
                    ? 'text-red-400'
                    : 'text-surface-300'
                "
              >
                {{ data.metadata?.timeLeft ?? "—" }}
              </span>
            </template>
          </Column>
          <Column header="Actions" style="width: 10rem">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  v-tooltip="'Decode token'"
                  icon="pi pi-key"
                  text
                  rounded
                  size="small"
                  @click.stop="onDecode(data)"
                />
                <Button
                  v-tooltip="'Token details'"
                  icon="pi pi-list"
                  text
                  rounded
                  size="small"
                  @click.stop="onViewDetails(data)"
                />
                <Button
                  v-tooltip="'Send to editor'"
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  @click.stop="onSendToEditor(data)"
                />
                <Button
                  v-tooltip="'Delete'"
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  @click.stop="deleteToken(data, emit)"
                />
              </div>
            </template>
          </Column>

          <template #expansion="{ data }">
            <FindingExpansion
              :finding="data"
              @decode="onDecode"
              @view-details="onViewDetails"
              @send-to-editor="onSendToEditor"
            />
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import FindingExpansion from "./FindingExpansion.vue";
import { useDashboard } from "./useDashboard";

import type { Finding } from "@/types";

const props = defineProps<{ findings: Finding[] }>();

const emit = defineEmits<{
  (e: "view-details", finding: Finding & { navigate?: boolean }): void;
  (e: "refresh"): void;
  (e: "filters-changed", filteredFindings: Finding[]): void;
  (e: "navigate-to", page: string): void;
}>();

const findings = computed(() => props.findings);

const {
  isLoading,
  expandedRows,
  filteredFindings,
  toggleExpand,
  onRowToggle,
  rowClass,
  formatTokenPreview,
  copyTokenToClipboard,
  deleteToken,
  handleFindingAdded,
  applyFilters,
  refreshFindings,
} = useDashboard({ findings });

// Local filter state (synced into useDashboard via applyFilters)
const localSearch = ref("");
const selectedSeveritiesLocal = ref([] as string[]);

const severityOptions = [
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
  { label: "Info", value: "info" },
];

function syncFilters() {
  applyFilters({
    search: localSearch.value,
    severities: selectedSeveritiesLocal.value,
    sources: [],
    algorithms: [],
  });
}

function onSearchInput() {
  syncFilters();
}

function clearSearch() {
  localSearch.value = "";
  syncFilters();
}

watch(selectedSeveritiesLocal, syncFilters);

function onRefresh() {
  refreshFindings(emit);
}

function onClearAll() {
  const toDelete = [...findings.value];
  toDelete.forEach((f: Finding) => deleteToken(f, emit));
}

function onRowClick(event: { data: Finding; originalEvent: Event }) {
  if (event.data === undefined) return;
  if ((event.originalEvent?.target as HTMLElement)?.closest?.(".p-button"))
    return;
  toggleExpand(event.data);
}

function onViewDetails(finding: Finding) {
  emit("view-details", { ...finding, navigate: true });
}

function onDecode(finding: Finding) {
  if (finding.metadata?.token) {
    emit("navigate-to", "Decoder");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("add-token-to-decoder", {
          detail: { token: finding.metadata.token },
        }),
      );
    }, 100);
  }
}

function onSendToEditor(finding: Finding) {
  if (finding.metadata?.token) {
    emit("navigate-to", "JWT Editor");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("add-token-to-editor", {
          detail: { token: finding.metadata.token },
        }),
      );
    }, 100);
  }
}

function severityBadgeClass(severity: string) {
  const base =
    "inline-block px-2 py-0.5 rounded text-xs font-medium capitalize";
  switch (severity) {
    case "critical":
      return `${base} bg-red-500/20 text-red-400 border border-red-500/30`;
    case "high":
      return `${base} bg-orange-500/20 text-orange-400 border border-orange-500/30`;
    case "medium":
      return `${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
    case "low":
      return `${base} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
    default:
      return `${base} bg-surface-700 text-surface-300 border border-surface-600`;
  }
}

function sourceBadgeClass(source: string) {
  const base =
    "inline-block px-2 py-0.5 rounded text-xs font-medium capitalize";
  switch (source) {
    case "request":
      return `${base} bg-blue-500/20 text-blue-400`;
    case "response":
      return `${base} bg-green-500/20 text-green-400`;
    case "manual":
      return `${base} bg-amber-500/20 text-amber-400`;
    default:
      return `${base} bg-surface-700 text-surface-400`;
  }
}

function onFindingAdded(e: Event) {
  handleFindingAdded(e, emit);
}

onMounted(() => {
  window.addEventListener("jwt-finding-added", onFindingAdded);
});
onBeforeUnmount(() => {
  window.removeEventListener("jwt-finding-added", onFindingAdded);
});
watch(filteredFindings, (val: Finding[]) => emit("filters-changed", val));
</script>
