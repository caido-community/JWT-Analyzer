import { getHashAlgorithm } from "./algorithms";
import { base64UrlToArrayBuffer } from "./base64";
import { importEcPublicKey, importRsaPublicKey } from "./keys";

type VerifyResult = { isValid: boolean; error?: string };

export async function verifyHMACSignature(
  data: string,
  signature: string,
  secret: string,
  alg: string,
): Promise<VerifyResult> {
  try {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: { name: getHashAlgorithm(alg) } },
      false,
      ["verify"],
    );
    const isValid = await window.crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToArrayBuffer(signature),
      enc.encode(data),
    );
    return { isValid };
  } catch (e) {
    return {
      isValid: false,
      error: `HMAC verification failed: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

export async function verifyRSASignature(
  data: string,
  signature: string,
  publicKeyPem: string,
  alg: string,
): Promise<VerifyResult> {
  try {
    const key = await importRsaPublicKey(publicKeyPem, alg);
    const hashAlg = getHashAlgorithm(alg);
    const isPSS = alg.startsWith("PS");
    const verifyAlg: AlgorithmIdentifier | RsaPssParams = isPSS
      ? {
          name: "RSA-PSS",
          saltLength:
            hashAlg === "SHA-256" ? 32 : hashAlg === "SHA-384" ? 48 : 64,
        }
      : { name: "RSASSA-PKCS1-v1_5" };
    const isValid = await window.crypto.subtle.verify(
      verifyAlg,
      key,
      base64UrlToArrayBuffer(signature),
      new TextEncoder().encode(data),
    );
    return { isValid };
  } catch (e) {
    return {
      isValid: false,
      error: `RSA verification failed: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

export async function verifyECDSASignature(
  data: string,
  signature: string,
  publicKeyPem: string,
  alg: string,
): Promise<VerifyResult> {
  try {
    const key = await importEcPublicKey(publicKeyPem, alg);
    const isValid = await window.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: getHashAlgorithm(alg) } },
      key,
      base64UrlToArrayBuffer(signature),
      new TextEncoder().encode(data),
    );
    return { isValid };
  } catch (e) {
    return {
      isValid: false,
      error: `ECDSA verification failed: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}
