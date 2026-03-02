import type { Finding } from "shared";
import { onBeforeUnmount, onMounted, ref } from "vue";

import { useSDK } from "@/plugins/sdk";

const STORAGE_KEY = "jwtFindings";

function parseStored(data: unknown): Finding[] {
  if (!Array.isArray(data)) return [];
  return data as Finding[];
}

export function useFindings() {
  const sdk = useSDK();
  const findings = ref<Finding[]>([]);

  function getStorage(): Record<string, unknown> {
    try {
      const raw = sdk.storage.get();
      return raw !== undefined && raw !== null && typeof raw === "object"
        ? (raw as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  async function saveFindings(list: Finding[]): Promise<void> {
    try {
      const current = getStorage();
      const payload = { ...current, [STORAGE_KEY]: list } as Record<
        string,
        unknown
      >;
      await (
        sdk.storage.set as (data: Record<string, unknown>) => Promise<void>
      )(payload);
    } catch {
      // ignore
    }
  }

  async function loadFindings(): Promise<void> {
    const stored = getStorage()[STORAGE_KEY];
    const fromStorage = parseStored(stored);
    if (fromStorage.length > 0) findings.value = fromStorage;

    const findingsApi = sdk.findings as
      | { getAll?: () => Promise<unknown[]> }
      | undefined;
    if (findingsApi?.getAll !== undefined) {
      try {
        const all = await findingsApi.getAll();
        const jwtFindings = (all ?? []).filter((f: unknown) => {
          const o = f as Record<string, unknown>;
          return (
            (typeof o?.title === "string" && o.title.includes("JWT")) ||
            o?.type === "JWT Token"
          );
        }) as Finding[];
        const byToken = new Set(findings.value.map((f) => f.metadata?.token));
        const newOnes = jwtFindings.filter(
          (f) => !byToken.has(f.metadata?.token),
        );
        if (newOnes.length > 0) {
          findings.value = [...newOnes, ...findings.value];
          await saveFindings(findings.value);
        }
      } catch {
        sdk.window.showToast("Failed to load findings", {
          variant: "error",
        });
      }
    }
  }

  function removeFinding(finding: Finding): void {
    if (finding?.id === undefined) return;
    findings.value = findings.value.filter((f) => f.id !== finding.id);
    saveFindings(findings.value);
    window.dispatchEvent(
      new CustomEvent("jwt-findings-refreshed", {
        detail: { findings: findings.value },
      }),
    );
    sdk.window.showToast("Token removed", { variant: "success" });
  }

  function clearAll(): void {
    findings.value = [];
    saveFindings(findings.value);
    window.dispatchEvent(
      new CustomEvent("jwt-findings-refreshed", { detail: { findings: [] } }),
    );
    sdk.window.showToast("All tokens cleared", { variant: "info" });
  }

  function addOrUpdateFinding(finding: Finding): void {
    const idx = findings.value.findIndex(
      (f) => f.metadata?.token === finding.metadata?.token,
    );
    if (idx === -1) findings.value = [finding, ...findings.value];
    else findings.value[idx] = finding;
    saveFindings(findings.value);
  }

  function onFindingAdded(event: Event): void {
    const detail = (event as CustomEvent).detail as Finding | undefined;
    if (detail === undefined) return;
    addOrUpdateFinding(detail);
    window.dispatchEvent(new CustomEvent("jwt-finding-added", { detail }));
  }

  function onFindingsRefreshed(event: Event): void {
    const detail = (event as CustomEvent).detail as { findings?: Finding[] };
    if (Array.isArray(detail?.findings)) findings.value = detail.findings;
  }

  const findingsSelectApi = sdk.findings as
    | { onSelect?: (type: string, cb: (f: Finding) => void) => void }
    | undefined;
  const backendApi = sdk.backend as unknown as
    | { onEvent?: (event: string, cb: (f: Finding) => void) => void }
    | undefined;

  onMounted(() => {
    loadFindings();
    if (findingsSelectApi?.onSelect !== undefined) {
      findingsSelectApi.onSelect("JWT Token", (finding: Finding) => {
        addOrUpdateFinding(finding);
        window.dispatchEvent(
          new CustomEvent("jwt-finding-added", { detail: finding }),
        );
      });
    }
    if (backendApi?.onEvent !== undefined) {
      backendApi.onEvent("jwt:analyzed", (finding: Finding) => {
        addOrUpdateFinding(finding);
        window.dispatchEvent(
          new CustomEvent("jwt-finding-added", { detail: finding }),
        );
        sdk.window.showToast("New JWT token analyzed", {
          variant: "success",
        });
      });
    }
    window.addEventListener("jwt-finding-added", onFindingAdded);
    window.addEventListener("jwt-findings-refreshed", onFindingsRefreshed);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("jwt-finding-added", onFindingAdded);
    window.removeEventListener("jwt-findings-refreshed", onFindingsRefreshed);
  });

  return {
    findings,
    loadFindings,
    saveFindings,
    removeFinding,
    clearAll,
    addOrUpdateFinding,
  };
}
