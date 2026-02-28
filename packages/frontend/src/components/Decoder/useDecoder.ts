import { computed, onMounted, onUnmounted, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import { createJWTStorageService } from "@/services/storage";
import type { FrontendSDK, JWTHeader, JWTPayload, JWTRisk } from "@/types";
import { analyzeJWTSecurity, decodeJWT } from "@/utils/jwt";

export interface DecodedToken {
  id: string;
  token: string;
  header: JWTHeader;
  payload: JWTPayload;
  analysis: {
    risks: JWTRisk[];
    suggestions: string[];
  };
  customName?: string;
}

const MAX_TOKEN_TABS = 10;

// Module-level state so it persists across component remounts (navigating away and back)
const _decodedTokens = ref([] as DecodedToken[]);
const _activeTokenTab = ref(0);
let _initialized = false;

export function useDecoder() {
  const sdk = useSDK();
  const storageService = sdk
    ? createJWTStorageService(sdk as unknown as FrontendSDK)
    : null;

  const manualToken = ref("");
  const decodedTokens = _decodedTokens;
  const activeTokenTab = _activeTokenTab;
  const showRenameModal = ref(false);
  const newTabName = ref("");
  const tabToRename = ref(-1);

  const isValidToken = computed(() => {
    if (manualToken.value === "") return false;
    return manualToken.value.split(".").length === 3;
  });

  function getSeverityType(severity: string): "danger" | "warning" | "info" {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
      case "medium":
        return "warning";
      default:
        return "info";
    }
  }

  function getTabTitle(decodedToken: DecodedToken): string {
    if (decodedToken.customName !== undefined && decodedToken.customName !== "")
      return decodedToken.customName;
    const alg = decodedToken.header?.alg ?? "unknown";
    const issuer = decodedToken.payload?.iss ?? "unknown";
    const short =
      decodedToken.token.length > 15
        ? decodedToken.token.substring(0, 12) + "..."
        : decodedToken.token;
    return `${alg} • ${issuer} • ${short}`;
  }

  async function saveTokensToStorage() {
    if (!storageService) return;
    try {
      await storageService.saveTokenDetailsTabs(decodedTokens.value);
    } catch {
      // ignore
    }
  }

  function addTokenTab(token: DecodedToken) {
    const existing = decodedTokens.value.findIndex(
      (t) => t.token === token.token,
    );
    if (existing !== -1) {
      decodedTokens.value[existing] = token;
      activeTokenTab.value = existing;
    } else {
      decodedTokens.value.push(token);
      if (decodedTokens.value.length > MAX_TOKEN_TABS) {
        decodedTokens.value.shift();
      }
      activeTokenTab.value = decodedTokens.value.length - 1;
    }
    saveTokensToStorage();
  }

  function decodeManualToken() {
    if (isValidToken.value !== true) return;
    try {
      const decoded = decodeJWT(manualToken.value);
      if (decoded?.header === undefined || decoded?.payload === undefined) {
        sdk?.window?.showToast?.("Failed to decode token", {
          variant: "error",
        });
        return;
      }
      const analysis = analyzeJWTSecurity(decoded.header, decoded.payload);
      const decodedToken: DecodedToken = {
        id: `manual-${Date.now()}`,
        token: manualToken.value,
        header: decoded.header,
        payload: decoded.payload,
        analysis,
      };
      addTokenTab(decodedToken);
      manualToken.value = "";
      submitToBackend(decodedToken.token);
    } catch {
      sdk?.window?.showToast?.("Error processing token", { variant: "error" });
    }
  }

  function closeTokenTab(index: number) {
    decodedTokens.value.splice(index, 1);
    if (index <= activeTokenTab.value) {
      activeTokenTab.value = Math.max(0, activeTokenTab.value - 1);
    }
    saveTokensToStorage();
  }

  function renameTab(index: number) {
    tabToRename.value = index;
    newTabName.value = decodedTokens.value[index]?.customName ?? "";
    showRenameModal.value = true;
  }

  function cancelRename() {
    showRenameModal.value = false;
    tabToRename.value = -1;
    newTabName.value = "";
  }

  function saveRename() {
    if (
      tabToRename.value >= 0 &&
      tabToRename.value < decodedTokens.value.length
    ) {
      const t = decodedTokens.value[tabToRename.value];
      if (t !== undefined) t.customName = newTabName.value;
      sdk?.window?.showToast?.("Tab renamed successfully", {
        variant: "success",
      });
    }
    showRenameModal.value = false;
    tabToRename.value = -1;
    newTabName.value = "";
    saveTokensToStorage();
  }

  function viewTokenDetails(
    token: DecodedToken,
    emit: (
      e: "view-details-decoder",
      token: string,
      header: JWTHeader,
      payload: JWTPayload,
      analysis: unknown,
      navigate?: boolean,
    ) => void,
  ) {
    if (token === undefined) return;
    emit(
      "view-details-decoder",
      token.token,
      token.header,
      token.payload,
      token.analysis,
      true,
    );
    submitToBackend(token.token);
    sdk?.window?.showToast?.("Token details view opened", {
      variant: "success",
    });
  }

  function sendToJWTEditor(
    token: DecodedToken,
    emitSendToEditor: (e: "send-to-editor", token: string) => void,
  ) {
    if (token !== undefined) {
      emitSendToEditor("send-to-editor", token.token);
      sdk?.window?.showToast?.("Opening JWT Editor with token", {
        variant: "success",
      });
    }
  }

  function submitToBackend(token: string) {
    if (sdk?.backend?.analyzeJWT !== undefined) {
      sdk.window?.showToast?.("Sending token to backend for analysis...", {
        variant: "info",
      });
      sdk.backend
        .analyzeJWT({ token, requestId: "manual", source: "manual" })
        .catch(() => {});
    }
  }

  function handleSetDecoderToken(event: Event) {
    const detail = (event as CustomEvent).detail as { token?: string };
    if (detail?.token !== undefined && detail.token !== "") {
      manualToken.value = detail.token;
      decodeManualToken();
    }
  }

  function handleAddTokenToDecoder(event: Event) {
    const detail = (event as CustomEvent).detail as { token?: string };
    if (detail?.token !== undefined && detail.token !== "") {
      manualToken.value = detail.token;
      decodeManualToken();
    }
  }

  onMounted(() => {
    // Only restore from storage on first mount; module-level refs keep state on subsequent mounts
    if (!_initialized && storageService) {
      _initialized = true;
      try {
        const saved = storageService.getTokenDetailsTabs();
        if (saved !== undefined && Array.isArray(saved) && saved.length > 0) {
          decodedTokens.value = saved.map((token: DecodedToken) => ({
            ...token,
            id: token.id ?? `token-${Date.now()}-${Math.random()}`,
          }));
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener("set-decoder-token", handleSetDecoderToken);
    window.addEventListener("add-token-to-decoder", handleAddTokenToDecoder);
  });

  onUnmounted(() => {
    window.removeEventListener("set-decoder-token", handleSetDecoderToken);
    window.removeEventListener("add-token-to-decoder", handleAddTokenToDecoder);
  });

  return {
    manualToken,
    decodedTokens,
    activeTokenTab,
    showRenameModal,
    newTabName,
    tabToRename,
    isValidToken,
    getSeverityType,
    getTabTitle,
    addTokenTab,
    decodeManualToken,
    closeTokenTab,
    renameTab,
    cancelRename,
    saveRename,
    viewTokenDetails,
    sendToJWTEditor,
  };
}
