import type { JWTHeader } from "shared";
import { computed, ref, type Ref } from "vue";

import type { JWTKey } from "./useKeyManager";
import type { EditorTab } from "./useTokenTabs";

import { useSDK } from "@/plugins/sdk";
import { signECDSA, signHMAC, signRSA, toBase64Url } from "@/utils/crypto";

export const SIGNING_ALG_OPTIONS = [
  { label: "HS256", value: "HS256" },
  { label: "HS384", value: "HS384" },
  { label: "HS512", value: "HS512" },
  { label: "RS256", value: "RS256" },
  { label: "RS384", value: "RS384" },
  { label: "RS512", value: "RS512" },
  { label: "PS256", value: "PS256" },
  { label: "PS384", value: "PS384" },
  { label: "PS512", value: "PS512" },
  { label: "ES256", value: "ES256" },
  { label: "ES384", value: "ES384" },
  { label: "ES512", value: "ES512" },
];

// Module-level state
const _showSignDialog = ref(false);
const _selectedKeyIndex = ref(-1);
const _tempKeyValue = ref("");
const _tempKeyAlgorithm = ref("HS256");
const _useTempKey = ref(false);

export function useSigning(keys: Ref<JWTKey[]>) {
  const sdk = useSDK();

  const showSignDialog = _showSignDialog;
  const selectedKeyIndex = _selectedKeyIndex;
  const tempKeyValue = _tempKeyValue;
  const tempKeyAlgorithm = _tempKeyAlgorithm;
  const useTempKey = _useTempKey;

  const keyOptions = computed(() => [
    { label: "Select a key", value: -1 },
    ...keys.value.map((k, i) => ({
      label: `${k.id}  (${k.algorithm})`,
      value: i,
    })),
  ]);

  function openSignDialog(): void {
    showSignDialog.value = true;
  }

  async function signTab(tab: EditorTab): Promise<void> {
    if (!tab.token) {
      sdk.window.showToast("Paste a token first", { variant: "error" });
      return;
    }
    const parts = tab.token.split(".");
    if (parts.length < 2) {
      sdk.window.showToast("Invalid token format", { variant: "error" });
      return;
    }

    // Parse header
    let header: JWTHeader;
    try {
      header = JSON.parse(tab.headerJson || "{}") as JWTHeader;
    } catch {
      header = { alg: "HS256" };
    }

    // Determine key to use
    let keyValue: string;
    let algorithm: string;

    if (!useTempKey.value && selectedKeyIndex.value >= 0) {
      const sel = keys.value[selectedKeyIndex.value];
      if (!sel) {
        sdk.window.showToast("Select a key or use temp key", {
          variant: "error",
        });
        return;
      }
      keyValue = sel.type === "symmetric" ? sel.value : sel.privateKey;
      algorithm = sel.algorithm;
    } else if (tempKeyValue.value) {
      keyValue = tempKeyValue.value;
      algorithm = tempKeyAlgorithm.value;
    } else {
      sdk.window.showToast("Provide a key or temp key to sign with", {
        variant: "error",
      });
      return;
    }

    header.alg = algorithm;
    const b64h = toBase64Url(JSON.stringify(header));
    const dataToSign = `${b64h}.${parts[1]}`;

    try {
      let signature = "";
      if (algorithm.startsWith("HS")) {
        signature = await signHMAC(dataToSign, keyValue, algorithm);
      } else if (algorithm.startsWith("RS") || algorithm.startsWith("PS")) {
        signature = await signRSA(dataToSign, keyValue, algorithm);
      } else if (algorithm.startsWith("ES")) {
        signature = await signECDSA(dataToSign, keyValue, algorithm);
      }

      tab.token = `${dataToSign}.${signature}`;
      tab.headerJson = JSON.stringify(header, null, 2);
      tab.headerJsonError = "";
      tab.signatureStale = false;

      sdk.window.showToast("Token signed successfully", {
        variant: "success",
      });
    } catch (e) {
      sdk.window.showToast(
        `Signing failed: ${e instanceof Error ? e.message : "unknown"}`,
        { variant: "error" },
      );
    }

    showSignDialog.value = false;
  }

  return {
    showSignDialog,
    selectedKeyIndex,
    tempKeyValue,
    tempKeyAlgorithm,
    useTempKey,
    keyOptions,
    openSignDialog,
    signTab,
  };
}
