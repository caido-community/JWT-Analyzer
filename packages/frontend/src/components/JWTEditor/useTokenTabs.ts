import type { JWTHeader, JWTPayload } from "jwt-analyzer-shared";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import { toBase64Url } from "@/utils/crypto";
import { analyzeJWTSecurity, decodeJWT } from "@/utils/jwt";

export type EditorTab = {
  id: string;
  name: string;
  token: string;
  headerJson: string;
  payloadJson: string;
  headerJsonError: string;
  payloadJsonError: string;
  decodedToken:
    | { header: JWTHeader; payload: JWTPayload; signature: string }
    | undefined;

  signatureStale?: boolean;
};

type ViewDetailsEmit = (
  e: "view-details-editor",
  token: string,
  header: JWTHeader,
  payload: JWTPayload,
  analysis: ReturnType<typeof analyzeJWTSecurity>,
  navigate: boolean,
) => void;

const _tabs = ref<EditorTab[]>([]);
const _activeIndex = ref(0);
let _initialized = false;

function makeTab(token = "", overrideName?: string): EditorTab {
  return {
    id: `editor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: overrideName ?? `Token ${_tabs.value.length + 1}`,
    token,
    headerJson: "",
    payloadJson: "",
    headerJsonError: "",
    payloadJsonError: "",
    decodedToken: undefined,
  };
}

export function useTokenTabs() {
  const sdk = useSDK();

  const tabs = _tabs;
  const activeIndex = _activeIndex;

  const activeTab = computed<EditorTab | undefined>(
    () => tabs.value[activeIndex.value],
  );

  function init(): void {
    if (_initialized) return;
    _initialized = true;
    if (tabs.value.length === 0) addTab(undefined);
  }

  // ── Tab management ─────────────────────────────────────────────────────

  function addTab(token?: string): void {
    const tab = makeTab(token);
    tabs.value.push(tab);
    activeIndex.value = tabs.value.length - 1;
    if (token !== undefined && token !== "") decodeTab(tab);
  }

  function closeTab(index: number): void {
    tabs.value.splice(index, 1);
    if (tabs.value.length === 0) addTab();
    else
      activeIndex.value = Math.max(0, Math.min(index, tabs.value.length - 1));
  }

  function renameTab(index: number, name: string): void {
    const tab = tabs.value[index];
    if (tab) tab.name = name;
  }

  // ── Decode / JSON validation / Update ─────────────────────────────────

  function decodeTab(tab: EditorTab): void {
    if (tab.token.trim() === "") return;
    const decoded = decodeJWT(tab.token);
    if (!decoded) {
      sdk.window.showToast("Invalid JWT format", { variant: "error" });
      return;
    }
    tab.decodedToken = decoded;
    tab.headerJson = JSON.stringify(decoded.header, null, 2);
    tab.payloadJson = JSON.stringify(decoded.payload, null, 2);
    tab.headerJsonError = "";
    tab.payloadJsonError = "";
    tab.signatureStale = false;
    if (tab.name.startsWith("Token ") || tab.name.startsWith("New Token ")) {
      const alg = decoded.header.alg ?? "unknown";
      const iss = decoded.payload.iss ?? "–";
      tab.name = `${alg} · ${iss}`;
    }
  }

  function decodeActiveTab(): void {
    const tab = activeTab.value;
    if (tab) decodeTab(tab);
  }

  function validateJson(tab: EditorTab, field: "header" | "payload"): void {
    const json = field === "header" ? tab.headerJson : tab.payloadJson;
    try {
      JSON.parse(json);
      if (field === "header") tab.headerJsonError = "";
      else tab.payloadJsonError = "";
    } catch {
      const msg = "Invalid JSON";
      if (field === "header") tab.headerJsonError = msg;
      else tab.payloadJsonError = msg;
    }
  }

  function updateToken(tab: EditorTab): void {
    if (tab.headerJsonError !== "" || tab.payloadJsonError !== "") {
      sdk.window.showToast("Fix JSON errors before updating", {
        variant: "error",
      });
      return;
    }
    try {
      const header = JSON.parse(tab.headerJson) as JWTHeader;
      const payload = JSON.parse(tab.payloadJson);
      const b64h = toBase64Url(JSON.stringify(header));
      const b64p = toBase64Url(JSON.stringify(payload));
      const parts = tab.token.split(".");
      if (parts.length === 3) {
        const newToken = `${b64h}.${b64p}.${parts[2]}`;
        const actuallyChanged = newToken !== tab.token;
        tab.token = newToken;
        if (actuallyChanged) {
          tab.signatureStale = true;
          sdk.window.showToast("Token updated - re-sign to make it valid", {
            variant: "warning",
          });
        }
      }
    } catch {
      sdk.window.showToast("Failed to update token", { variant: "error" });
    }
  }

  // ── Emit view-details ──────────────────────────────────────────────────

  function saveToDetails(tab: EditorTab, emit: ViewDetailsEmit): void {
    if (!tab.decodedToken) {
      sdk.window.showToast("Decode a token first", { variant: "error" });
      return;
    }
    try {
      const header = JSON.parse(tab.headerJson) as JWTHeader;
      const payload = JSON.parse(tab.payloadJson) as JWTPayload;
      const analysis = analyzeJWTSecurity(header, payload);
      emit("view-details-editor", tab.token, header, payload, analysis, true);
    } catch {
      sdk.window.showToast("Error reading token data", {
        variant: "error",
      });
    }
  }

  // ── Copy token ─────────────────────────────────────────────────────────

  async function copyToken(tab: EditorTab): Promise<void> {
    if (tab.token === "") return;
    try {
      await navigator.clipboard.writeText(tab.token);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = tab.token;
      ta.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    sdk.window.showToast("Token copied!", { variant: "success" });
  }

  // ── Sync token field → auto-decode when pasted ─────────────────────────

  function onTokenInput(tab: EditorTab): void {
    const parts = tab.token.split(".");
    const [p0, p1, p2] = parts;
    if (
      parts.length === 3 &&
      p0 !== undefined &&
      p0 !== "" &&
      p1 !== undefined &&
      p1 !== "" &&
      p2 !== undefined &&
      p2 !== ""
    ) {
      decodeTab(tab);
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  function handleAddToken(evt: Event): void {
    const detail = (evt as CustomEvent).detail as
      | { token?: string }
      | undefined;
    const token = detail?.token;
    if (token !== undefined && token !== "") {
      const tab = makeTab(token, `New Token ${tabs.value.length + 1}`);
      tabs.value.push(tab);
      activeIndex.value = tabs.value.length - 1;
      decodeTab(tab);
    }
  }

  onMounted(() => {
    init();
    window.addEventListener("add-token-to-editor", handleAddToken);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("add-token-to-editor", handleAddToken);
  });

  return {
    tabs,
    activeIndex,
    activeTab,
    addTab,
    closeTab,
    renameTab,
    decodeActiveTab,
    decodeTab,
    validateJson,
    updateToken,
    saveToDetails,
    copyToken,
    onTokenInput,
  };
}
