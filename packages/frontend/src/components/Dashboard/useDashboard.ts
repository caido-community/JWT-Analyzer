import { computed, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import { createJWTStorageService } from "@/services/storage";
import type { Finding, FrontendSDK } from "@/types";

export interface JWTFilter {
  search: string;
  severities: string[];
  sources: string[];
  algorithms: string[];
}

export function useDashboard(props: { findings: { value: Finding[] } }) {
  const sdk = useSDK();
  const { findings } = props;

  const isLoading = ref(false);
  const expandedRows = ref([] as Finding[]);
  const searchQuery = ref("");
  const selectedSeverities = ref([] as string[]);
  const selectedSources = ref([] as string[]);
  const selectedAlgorithms = ref([] as string[]);

  const jwtCount = computed(() => findings.value.length);
  const criticalCount = computed(
    () =>
      findings.value.filter((f: Finding) => f.severity === "critical").length,
  );
  const highCount = computed(
    () => findings.value.filter((f: Finding) => f.severity === "high").length,
  );
  const mediumCount = computed(
    () => findings.value.filter((f: Finding) => f.severity === "medium").length,
  );
  const lowCount = computed(
    () => findings.value.filter((f: Finding) => f.severity === "low").length,
  );

  const filteredFindings = computed(() => {
    let result = [...findings.value];
    if (searchQuery.value.trim() !== "") {
      const query = searchQuery.value.toLowerCase();
      result = result.filter((f: Finding) => {
        if (f.metadata?.token && f.metadata.token.toLowerCase().includes(query))
          return true;
        if (f.title?.toLowerCase().includes(query)) return true;
        if (f.metadata?.payload !== undefined) {
          if (JSON.stringify(f.metadata.payload).toLowerCase().includes(query))
            return true;
        }
        if (f.metadata?.header !== undefined) {
          if (JSON.stringify(f.metadata.header).toLowerCase().includes(query))
            return true;
        }
        return false;
      });
    }
    if (selectedSeverities.value.length > 0) {
      result = result.filter(
        (f: Finding): boolean =>
          f.severity !== undefined &&
          selectedSeverities.value.includes(f.severity),
      );
    }
    if (selectedSources.value.length > 0) {
      result = result.filter(
        (f: Finding): boolean =>
          f.metadata?.source !== undefined &&
          selectedSources.value.includes(f.metadata.source),
      );
    }
    if (selectedAlgorithms.value.length > 0) {
      result = result.filter(
        (f: Finding): boolean =>
          f.metadata?.header?.alg !== undefined &&
          selectedAlgorithms.value.includes(f.metadata.header.alg),
      );
    }
    return result;
  });

  function toggleExpand(finding: Finding) {
    const idx = expandedRows.value.findIndex(
      (r: Finding) => r.id === finding.id,
    );
    if (idx >= 0) {
      expandedRows.value = expandedRows.value.filter(
        (r: Finding) => r.id !== finding.id,
      );
    } else {
      expandedRows.value = [...expandedRows.value, finding];
    }
  }

  function onRowToggle(event: { data: Finding[] }) {
    expandedRows.value = event.data;
  }

  function rowClass(data: Finding): Record<string, boolean> {
    const severityClass = data.severity
      ? `severity-${data.severity}`
      : "severity-info";
    return {
      "finding-row": true,
      "source-request": data.metadata?.source === "request",
      "source-response": data.metadata?.source === "response",
      "source-manual": data.metadata?.source === "manual",
      [severityClass]: true,
    };
  }

  function formatTokenPreview(token: string): string {
    if (!token) return "Unknown Token";
    const parts = token.split(".");
    if (parts.length >= 2 && parts[0] !== undefined && parts[1] !== undefined) {
      return `${parts[0].substring(0, 10)}...${parts[1].substring(0, 8)}...`;
    }
    return token.length > 20 ? `${token.substring(0, 20)}...` : token;
  }

  async function copyTokenToClipboard(token: string): Promise<void> {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      sdk?.window?.showToast?.("JWT token copied to clipboard", {
        variant: "success",
      });
    } catch {
      const ta = document.createElement("textarea");
      ta.value = token;
      ta.style.position = "fixed";
      ta.style.left = "-999999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        sdk?.window?.showToast?.("JWT token copied to clipboard", {
          variant: "success",
        });
      } catch {
        sdk?.window?.showToast?.("Failed to copy token", { variant: "error" });
      }
      document.body.removeChild(ta);
    }
  }

  function deleteToken(
    finding: Finding,
    emit: (e: string, payload?: unknown) => void,
  ) {
    if (!finding?.id || !sdk) return;
    const newFindings = findings.value.filter(
      (f: Finding) => f.id !== finding.id,
    );
    const storageService = createJWTStorageService(
      sdk as unknown as FrontendSDK,
    );
    storageService.saveFindings(newFindings);
    emit("refresh");
    window.dispatchEvent(
      new CustomEvent("jwt-findings-refreshed", {
        detail: { findings: newFindings },
      }),
    );
    sdk?.window?.showToast?.("Token deleted successfully", {
      variant: "success",
    });
  }

  function handleFindingAdded(event: Event, emit: (e: string) => void) {
    const detail = (event as CustomEvent).detail as Finding | undefined;
    if (detail === undefined) return;
    const alreadyExpanded: boolean = expandedRows.value.some(
      (r: Finding): boolean => r.id === detail.id,
    );
    if (!alreadyExpanded) {
      expandedRows.value = [...expandedRows.value, detail];
    }
    emit("refresh");
  }

  function applyFilters(filters: JWTFilter) {
    searchQuery.value = filters.search;
    selectedSeverities.value = filters.severities;
    selectedSources.value = filters.sources;
    selectedAlgorithms.value = filters.algorithms;
  }

  function refreshFindings(emit: (e: string) => void) {
    isLoading.value = true;
    emit("refresh");
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  }

  return {
    isLoading,
    expandedRows,
    searchQuery,
    selectedSeverities,
    selectedSources,
    selectedAlgorithms,
    jwtCount,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
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
  };
}
