import { getHashAlgorithm } from "./algorithms";
import { signatureToBase64Url } from "./base64";
import { importEcPrivateKey, importRsaPrivateKey } from "./keys";

export async function signHMAC(
  data: string,
  secret: string,
  alg: string,
): Promise<string> {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: { name: getHashAlgorithm(alg) } },
    false,
    ["sign"],
  );
  const sig = await window.crypto.subtle.sign("HMAC", key, enc.encode(data));
  return signatureToBase64Url(sig);
}

export async function signRSA(
  data: string,
  privateKeyPem: string,
  alg: string,
): Promise<string> {
  const key = await importRsaPrivateKey(privateKeyPem, alg);
  const hashAlg = getHashAlgorithm(alg);
  const isPSS = alg.startsWith("PS");
  const signAlg: AlgorithmIdentifier | RsaPssParams = isPSS
    ? {
        name: "RSA-PSS",
        saltLength:
          hashAlg === "SHA-256" ? 32 : hashAlg === "SHA-384" ? 48 : 64,
      }
    : { name: "RSASSA-PKCS1-v1_5" };
  const sig = await window.crypto.subtle.sign(
    signAlg,
    key,
    new TextEncoder().encode(data),
  );
  return signatureToBase64Url(sig);
}

export async function signECDSA(
  data: string,
  privateKeyPem: string,
  alg: string,
): Promise<string> {
  const key = await importEcPrivateKey(privateKeyPem, alg);
  const sig = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: getHashAlgorithm(alg) } },
    key,
    new TextEncoder().encode(data),
  );
  return signatureToBase64Url(sig);
}
