import type { JWTHeader, JWTPayload, JWTRisk } from "jwt-analyzer-shared";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import { analyzeJWTSecurity, decodeJWT } from "@/utils/jwt";

export type DecodedToken = {
  id: string;
  token: string;
  header: JWTHeader;
  payload: JWTPayload;
  analysis: { risks: JWTRisk[]; suggestions: string[] };
  customName?: string;
};

const MAX_TOKEN_TABS = 10;
const _decodedTokens = ref<DecodedToken[]>([]);
const _activeTokenTab = ref(0);

export function useDecoder() {
  const sdk = useSDK();
  const manualToken = ref("");
  const decodedTokens = _decodedTokens;
  const activeTokenTab = _activeTokenTab;

  const isValidToken = computed(() => {
    const t = manualToken.value.trim();
    return t.length > 0 && t.split(".").length === 3;
  });

  function getTabTitle(decoded: DecodedToken): string {
    if (decoded.customName !== undefined && decoded.customName.length > 0)
      return decoded.customName;
    const alg = decoded.header?.alg ?? "unknown";
    const issuer = (decoded.payload?.iss as string) ?? "unknown";
    const short =
      decoded.token.length > 15
        ? `${decoded.token.slice(0, 12)}...`
        : decoded.token;
    return `${alg} • ${issuer} • ${short}`;
  }

  function addTokenTab(token: DecodedToken): void {
    const existing = decodedTokens.value.findIndex(
      (t) => t.token === token.token,
    );
    if (existing !== -1) {
      decodedTokens.value[existing] = token;
      activeTokenTab.value = existing;
    } else {
      decodedTokens.value.push(token);
      if (decodedTokens.value.length > MAX_TOKEN_TABS)
        decodedTokens.value.shift();
      activeTokenTab.value = decodedTokens.value.length - 1;
    }
  }

  function decodeManualToken(): void {
    if (isValidToken.value !== true) return;
    const raw = manualToken.value.trim();
    try {
      const decoded = decodeJWT(raw);
      if (
        decoded === undefined ||
        decoded.header === undefined ||
        decoded.payload === undefined
      ) {
        sdk.window.showToast("Failed to decode token", {
          variant: "error",
        });
        return;
      }
      const analysis = analyzeJWTSecurity(decoded.header, decoded.payload);
      const decodedToken: DecodedToken = {
        id: `manual-${Date.now()}`,
        token: raw,
        header: decoded.header,
        payload: decoded.payload,
        analysis,
      };
      addTokenTab(decodedToken);
      manualToken.value = "";
    } catch {
      sdk.window.showToast("Error processing token", { variant: "error" });
    }
  }

  function closeTokenTab(index: number): void {
    decodedTokens.value.splice(index, 1);
    if (index <= activeTokenTab.value) {
      activeTokenTab.value = Math.max(0, activeTokenTab.value - 1);
    }
  }

  function viewTokenDetails(
    token: DecodedToken,
    emit: (
      e: "view-details-decoder",
      tokenStr: string,
      header: JWTHeader,
      payload: JWTPayload,
      analysis: { risks: JWTRisk[]; suggestions: string[] },
      navigate: boolean,
    ) => void,
  ): void {
    if (token === undefined) return;
    emit(
      "view-details-decoder",
      token.token,
      token.header,
      token.payload,
      token.analysis,
      true,
    );
    sdk.window.showToast("Token details view opened", {
      variant: "success",
    });
  }

  function sendToJWTEditor(
    token: DecodedToken,
    emitSend: (e: "send-to-editor", tokenStr: string) => void,
  ): void {
    if (token !== undefined) {
      emitSend("send-to-editor", token.token);
      sdk.window.showToast("Opening JWT Editor with token", {
        variant: "success",
      });
    }
  }

  function handleAddTokenToDecoder(event: Event): void {
    const detail = (event as CustomEvent).detail as { token?: string };
    const token = detail?.token;
    if (token !== undefined && token.length > 0) {
      manualToken.value = token;
      setTimeout(() => decodeManualToken(), 0);
    }
  }

  onMounted(() => {
    window.addEventListener("add-token-to-decoder", handleAddTokenToDecoder);
    window.addEventListener("set-decoder-token", handleAddTokenToDecoder);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("add-token-to-decoder", handleAddTokenToDecoder);
    window.removeEventListener("set-decoder-token", handleAddTokenToDecoder);
  });

  return {
    manualToken,
    decodedTokens,
    activeTokenTab,
    isValidToken,
    getTabTitle,
    addTokenTab,
    decodeManualToken,
    closeTokenTab,
    viewTokenDetails,
    sendToJWTEditor,
  };
}
