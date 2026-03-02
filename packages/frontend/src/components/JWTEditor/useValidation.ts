import type { JWTHeader } from "shared";
import { computed, ref, type Ref } from "vue";

import type { JWTKey } from "./useKeyManager";
import type { EditorTab } from "./useTokenTabs";

import { useSDK } from "@/plugins/sdk";
import {
  toBase64Url,
  verifyECDSASignature,
  verifyHMACSignature,
  verifyRSASignature,
} from "@/utils/crypto";

// Module-level state
const _validationKeyIndex = ref(-1);

export function useValidation(keys: Ref<JWTKey[]>) {
  const sdk = useSDK();

  const validationKeyIndex = _validationKeyIndex;

  const validationKeyOptions = computed(() => [
    { label: "Select key for validation", value: -1 },
    ...keys.value.map((k, i) => ({
      label: `${k.id}  (${k.algorithm})`,
      value: i,
    })),
  ]);

  function validateJWTFields(
    header: JWTHeader,
    payload: Record<string, unknown>,
  ): string[] {
    const errors: string[] = [];
    if (header.alg !== undefined && typeof header.alg !== "string")
      errors.push('"alg" must be a string');
    if (payload.exp !== undefined && !Number.isInteger(payload.exp))
      errors.push('"exp" must be an integer timestamp');
    if (payload.iat !== undefined && !Number.isInteger(payload.iat))
      errors.push('"iat" must be an integer timestamp');
    if (payload.nbf !== undefined && !Number.isInteger(payload.nbf))
      errors.push('"nbf" must be an integer timestamp');
    if (payload.iss !== undefined && typeof payload.iss !== "string")
      errors.push('"iss" must be a string');
    if (payload.sub !== undefined && typeof payload.sub !== "string")
      errors.push('"sub" must be a string');
    return errors;
  }

  function checkSignatureMatch(
    tab: EditorTab,
    header: JWTHeader,
    payload: Record<string, unknown>,
  ): boolean {
    try {
      const b64h = toBase64Url(JSON.stringify(header));
      const b64p = toBase64Url(JSON.stringify(payload));
      const parts = tab.token.split(".");
      return parts.length === 3 && parts[0] === b64h && parts[1] === b64p;
    } catch {
      return false;
    }
  }

  async function validateTab(tab: EditorTab): Promise<void> {
    if (!tab.decodedToken) {
      sdk.window.showToast("Decode a token first", { variant: "error" });
      return;
    }
    if (tab.headerJsonError || tab.payloadJsonError) {
      sdk.window.showToast("Fix JSON errors first", { variant: "error" });
      return;
    }

    let header: JWTHeader;
    let payload: Record<string, unknown>;
    try {
      header = JSON.parse(tab.headerJson) as JWTHeader;
      payload = JSON.parse(tab.payloadJson) as Record<string, unknown>;
    } catch {
      sdk.window.showToast("Invalid JSON in header or payload", {
        variant: "error",
      });
      return;
    }

    const fieldErrors = validateJWTFields(header, payload);
    if (fieldErrors.length > 0) {
      sdk.window.showToast(`Invalid fields: ${fieldErrors.join(", ")}`, {
        variant: "error",
      });
      return;
    }

    if (!checkSignatureMatch(tab, header, payload)) {
      sdk.window.showToast(
        "TOKEN MODIFIED - re-sign before validating signature",
        { variant: "warning" },
      );
      return;
    }

    const alg = header.alg;
    if (!alg || alg === "none") {
      sdk.window.showToast("Token uses alg=none - no signature to verify", {
        variant: "warning",
      });
      return;
    }

    if (validationKeyIndex.value < 0) {
      sdk.window.showToast("Select a key for cryptographic validation", {
        variant: "info",
      });
      return;
    }

    const key = keys.value[validationKeyIndex.value] as JWTKey | undefined;
    if (!key) {
      sdk.window.showToast("Selected key not found", { variant: "error" });
      return;
    }

    if (key.algorithm !== alg) {
      sdk.window.showToast(
        `Key algorithm (${key.algorithm}) ≠ token algorithm (${alg})`,
        { variant: "error" },
      );
      return;
    }

    const parts = tab.token.split(".");
    if (parts.length !== 3) {
      sdk.window.showToast("Invalid token structure", { variant: "error" });
      return;
    }
    const dataToVerify = `${parts[0]}.${parts[1]}`;
    const signature = parts[2] ?? "";
    const pubOrSecret =
      key.type === "symmetric"
        ? key.value
        : key.publicKey.length > 0
          ? key.publicKey
          : key.value;

    let result: { isValid: boolean; error?: string };
    if (alg.startsWith("HS")) {
      result = await verifyHMACSignature(
        dataToVerify,
        signature,
        pubOrSecret,
        alg,
      );
    } else if (alg.startsWith("RS") || alg.startsWith("PS")) {
      result = await verifyRSASignature(
        dataToVerify,
        signature,
        pubOrSecret,
        alg,
      );
    } else if (alg.startsWith("ES")) {
      result = await verifyECDSASignature(
        dataToVerify,
        signature,
        pubOrSecret,
        alg,
      );
    } else {
      sdk.window.showToast(`Unsupported algorithm: ${alg}`, {
        variant: "error",
      });
      return;
    }

    if (result.error !== undefined && result.error !== "") {
      sdk.window.showToast(`Validation failed: ${result.error}`, {
        variant: "error",
      });
      return;
    }

    if (!result.isValid) {
      sdk.window.showToast("INVALID SIGNATURE - verification failed", {
        variant: "error",
      });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp as number | undefined;
    const nbf = payload.nbf as number | undefined;
    if (exp !== undefined && exp < now) {
      sdk.window.showToast("Valid signature - but token has expired", {
        variant: "warning",
      });
      return;
    }
    if (nbf !== undefined && nbf > now) {
      sdk.window.showToast(
        "Valid signature - but token is not yet valid (nbf)",
        {
          variant: "warning",
        },
      );
      return;
    }

    sdk.window.showToast("VALID - signature verified and token is active", {
      variant: "success",
    });
  }

  return {
    validationKeyIndex,
    validationKeyOptions,
    validateTab,
  };
}
