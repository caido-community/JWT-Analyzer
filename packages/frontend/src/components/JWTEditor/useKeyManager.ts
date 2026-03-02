import { ref, watch } from "vue";

import { useSDK } from "@/plugins/sdk";
import { generateEcKeyPair, generateRsaKeyPair } from "@/utils/crypto";

const STORAGE_KEY = "jwtEditorKeys";

export type JWTKey = {
  id: string;
  name: string;
  type: "symmetric" | "asymmetric";
  algorithm: string;
  value: string;
  publicKey: string;
  privateKey: string;
};

type KeyForm = Omit<JWTKey, "name">;

const EMPTY_FORM: KeyForm = {
  id: "",
  type: "symmetric",
  algorithm: "HS256",
  value: "",
  publicKey: "",
  privateKey: "",
};

export const KEY_TYPE_OPTIONS = [
  { label: "Symmetric (HMAC)", value: "symmetric" },
  { label: "Asymmetric (RSA/EC)", value: "asymmetric" },
];

export const SYMMETRIC_ALG_OPTIONS = [
  { label: "HS256", value: "HS256" },
  { label: "HS384", value: "HS384" },
  { label: "HS512", value: "HS512" },
];

export const ASYMMETRIC_ALG_OPTIONS = [
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
const _keys = ref<JWTKey[]>([]);
const _showKeyDialog = ref(false);
const _editingIndex = ref(-1);
const _keyForm = ref<KeyForm>({ ...EMPTY_FORM });
const _showKeyValue = ref(false);
const _showPrivateKey = ref(false);
let _initialized = false;

export function useKeyManager() {
  const sdk = useSDK();

  const keys = _keys;
  const showKeyDialog = _showKeyDialog;
  const editingIndex = _editingIndex;
  const keyForm = _keyForm;
  const showKeyValue = _showKeyValue;
  const showPrivateKey = _showPrivateKey;

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

  async function saveKeys(list: JWTKey[]): Promise<void> {
    try {
      const payload = { ...getStorage(), [STORAGE_KEY]: list } as Record<
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

  function loadKeys(): void {
    if (_initialized) return;
    _initialized = true;
    const stored = getStorage()[STORAGE_KEY];
    if (Array.isArray(stored) && stored.length > 0)
      keys.value = stored as JWTKey[];
    watch(keys, () => saveKeys(keys.value), { deep: true });
  }

  function openNewKeyDialog(): void {
    editingIndex.value = -1;
    keyForm.value = { ...EMPTY_FORM };
    showKeyValue.value = false;
    showPrivateKey.value = false;
    showKeyDialog.value = true;
  }

  function editKey(index: number): void {
    const key = keys.value[index];
    if (!key) return;
    editingIndex.value = index;
    keyForm.value = { ...key };
    showKeyDialog.value = true;
  }

  function deleteKey(index: number): void {
    keys.value.splice(index, 1);
    saveKeys(keys.value);
    sdk.window.showToast("Key deleted", { variant: "success" });
  }

  function generateRandomKey(): void {
    const len =
      keyForm.value.algorithm === "HS256"
        ? 32
        : keyForm.value.algorithm === "HS384"
          ? 48
          : 64;
    const arr = new Uint8Array(len);
    window.crypto.getRandomValues(arr);
    keyForm.value.value = Array.from(arr, (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    sdk.window.showToast("Secret key generated", { variant: "success" });
  }

  async function generateKeyPair(): Promise<void> {
    const alg = keyForm.value.algorithm;
    try {
      const kp = alg.startsWith("ES")
        ? await generateEcKeyPair(alg)
        : await generateRsaKeyPair(alg);
      keyForm.value.publicKey = kp.publicKey;
      keyForm.value.privateKey = kp.privateKey;
      sdk.window.showToast(`${alg} key pair generated`, {
        variant: "success",
      });
    } catch {
      sdk.window.showToast("Key generation failed", { variant: "error" });
    }
  }

  async function saveKey(): Promise<void> {
    if (!keyForm.value.id.trim()) {
      sdk.window.showToast("Key ID is required", { variant: "error" });
      return;
    }
    if (!keyForm.value.algorithm) {
      sdk.window.showToast("Algorithm is required", { variant: "error" });
      return;
    }
    if (keyForm.value.type === "symmetric" && !keyForm.value.value) {
      generateRandomKey();
    }
    if (
      keyForm.value.type === "asymmetric" &&
      (!keyForm.value.publicKey || !keyForm.value.privateKey)
    ) {
      await generateKeyPair();
    }
    const key: JWTKey = { ...keyForm.value, name: keyForm.value.id };
    if (editingIndex.value !== -1) {
      keys.value[editingIndex.value] = key;
    } else {
      keys.value.push(key);
    }
    showKeyDialog.value = false;
    editingIndex.value = -1;
    keyForm.value = { ...EMPTY_FORM };
    await saveKeys(keys.value);
    sdk.window.showToast("Key saved", { variant: "success" });
  }

  loadKeys();

  return {
    keys,
    showKeyDialog,
    editingIndex,
    keyForm,
    showKeyValue,
    showPrivateKey,
    openNewKeyDialog,
    editKey,
    deleteKey,
    generateRandomKey,
    generateKeyPair,
    saveKey,
  };
}
