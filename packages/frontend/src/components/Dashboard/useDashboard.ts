import type { Finding } from "shared";
import { computed, ref } from "vue";

import { useSDK } from "@/plugins/sdk";

type JWTFilter = {
  search: string;
  severities: string[];
  sources: string[];
  algorithms: string[];
};

export function useDashboard(props: { findings: { value: Finding[] } }) {
  const sdk = useSDK();
  const { findings } = props;

  const isLoading = ref(false);
  const expandedRows = ref<Finding[]>([]);
  const searchQuery = ref("");
  const selectedSeverities = ref<string[]>([]);
  const selectedSources = ref<string[]>([]);
  const selectedAlgorithms = ref<string[]>([]);

  const totalCount = computed(() => findings.value.length);
  const criticalCount = computed(
    () => findings.value.filter((f) => f.severity === "critical").length,
  );
  const highCount = computed(
    () => findings.value.filter((f) => f.severity === "high").length,
  );

  const filteredFindings = computed(() => {
    let result = [...findings.value];
    const q = searchQuery.value.trim();
    if (q !== "") {
      const query = q.toLowerCase();
      result = result.filter((f: Finding) => {
        if (f.metadata?.token?.toLowerCase().includes(query)) return true;
        if (f.title?.toLowerCase().includes(query)) return true;
        if (
          f.metadata?.payload !== undefined &&
          JSON.stringify(f.metadata.payload).toLowerCase().includes(query)
        )
          return true;
        if (
          f.metadata?.header !== undefined &&
          JSON.stringify(f.metadata.header).toLowerCase().includes(query)
        )
          return true;
        return false;
      });
    }
    if (selectedSeverities.value.length > 0) {
      result = result.filter(
        (f: Finding) =>
          f.severity !== undefined &&
          selectedSeverities.value.includes(f.severity),
      );
    }
    if (selectedSources.value.length > 0) {
      result = result.filter(
        (f: Finding) =>
          f.metadata?.source !== undefined &&
          selectedSources.value.includes(f.metadata.source),
      );
    }
    if (selectedAlgorithms.value.length > 0) {
      result = result.filter(
        (f: Finding) =>
          f.metadata?.header?.alg !== undefined &&
          selectedAlgorithms.value.includes(f.metadata.header.alg),
      );
    }
    return result;
  });

  function toggleExpand(finding: Finding): void {
    const idx = expandedRows.value.findIndex((r) => r.id === finding.id);
    if (idx >= 0) {
      expandedRows.value = expandedRows.value.filter(
        (r) => r.id !== finding.id,
      );
    } else {
      expandedRows.value = [...expandedRows.value, finding];
    }
  }

  function onRowToggle(event: { data: Finding[] }): void {
    expandedRows.value = event.data ?? [];
  }

  function rowClass(data: Finding): Record<string, boolean> {
    return {
      "border-l-2 border-surface-600": true,
      "border-l-blue-500/50": data.metadata?.source === "request",
      "border-l-green-500/50": data.metadata?.source === "response",
      "border-l-amber-500/50": data.metadata?.source === "manual",
    };
  }

  function formatTokenPreview(token: string): string {
    if (token.length === 0) return "-";
    const parts = token.split(".");
    if (parts.length >= 2 && parts[0] !== undefined && parts[1] !== undefined) {
      return `${parts[0].slice(0, 10)}...${parts[1].slice(0, 8)}...`;
    }
    return token.length > 20 ? `${token.slice(0, 20)}...` : token;
  }

  async function copyTokenToClipboard(token: string): Promise<void> {
    if (token.length === 0) return;
    try {
      await navigator.clipboard.writeText(token);
      sdk.window.showToast("Copied", { variant: "success" });
    } catch {
      const ta = document.createElement("textarea");
      ta.value = token;
      ta.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        sdk.window.showToast("Copied", { variant: "success" });
      } catch {
        sdk.window.showToast("Copy failed", { variant: "error" });
      }
      document.body.removeChild(ta);
    }
  }

  function applyFilters(filters: JWTFilter): void {
    searchQuery.value = filters.search;
    selectedSeverities.value = filters.severities;
    selectedSources.value = filters.sources;
    selectedAlgorithms.value = filters.algorithms;
  }

  function handleFindingAdded(event: Event, emitRefresh: () => void): void {
    const detail = (event as CustomEvent).detail as Finding | undefined;
    if (detail === undefined) return;
    if (!expandedRows.value.some((r) => r.id === detail.id)) {
      expandedRows.value = [...expandedRows.value, detail];
    }
    emitRefresh();
  }

  function refreshFindings(emitRefresh: () => void): void {
    isLoading.value = true;
    emitRefresh();
    setTimeout(() => {
      isLoading.value = false;
    }, 400);
  }

  return {
    isLoading,
    expandedRows,
    totalCount,
    criticalCount,
    highCount,
    filteredFindings,
    toggleExpand,
    onRowToggle,
    rowClass,
    formatTokenPreview,
    copyTokenToClipboard,
    applyFilters,
    handleFindingAdded,
    refreshFindings,
  };
}
