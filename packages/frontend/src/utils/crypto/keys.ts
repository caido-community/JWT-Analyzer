import { getEcCurve, getHashAlgorithm } from "./algorithms";
import { arrayBufferToBase64, base64ToArrayBuffer, formatPEM } from "./base64";

export async function importRsaPublicKey(
  pem: string,
  alg: string,
): Promise<CryptoKey> {
  const clean = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s/g, "");
  const algName = alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5";
  return window.crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(clean),
    { name: algName, hash: { name: getHashAlgorithm(alg) } },
    false,
    ["verify"],
  );
}

export async function importRsaPrivateKey(
  pem: string,
  alg: string,
): Promise<CryptoKey> {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const algName = alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5";
  return window.crypto.subtle.importKey(
    "pkcs8",
    base64ToArrayBuffer(clean),
    { name: algName, hash: { name: getHashAlgorithm(alg) } },
    false,
    ["sign"],
  );
}

export async function importEcPublicKey(
  pem: string,
  alg: string,
): Promise<CryptoKey> {
  const clean = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s/g, "");
  return window.crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(clean),
    { name: "ECDSA", namedCurve: getEcCurve(alg) },
    false,
    ["verify"],
  );
}

export async function importEcPrivateKey(
  pem: string,
  alg: string,
): Promise<CryptoKey> {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  return window.crypto.subtle.importKey(
    "pkcs8",
    base64ToArrayBuffer(clean),
    { name: "ECDSA", namedCurve: getEcCurve(alg) },
    false,
    ["sign"],
  );
}

export async function generateRsaKeyPair(
  alg: string,
): Promise<{ publicKey: string; privateKey: string }> {
  const isPSS = alg.startsWith("PS");
  const algName = isPSS ? "RSA-PSS" : "RSASSA-PKCS1-v1_5";
  const modulusLength = alg.endsWith("512") ? 4096 : 2048;
  const kp = await window.crypto.subtle.generateKey(
    {
      name: algName,
      modulusLength,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: { name: getHashAlgorithm(alg) },
    },
    true,
    ["sign", "verify"],
  );
  const pub = arrayBufferToBase64(
    await window.crypto.subtle.exportKey("spki", kp.publicKey),
  );
  const priv = arrayBufferToBase64(
    await window.crypto.subtle.exportKey("pkcs8", kp.privateKey),
  );
  return {
    publicKey: `-----BEGIN PUBLIC KEY-----\n${formatPEM(pub)}\n-----END PUBLIC KEY-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${formatPEM(priv)}\n-----END PRIVATE KEY-----`,
  };
}

export async function generateRsaKeyPairForJwk(alg: string): Promise<{
  jwk: { kty: string; n: string; e: string; alg?: string };
  privateKeyPem: string;
}> {
  const isPSS = alg.startsWith("PS");
  const algName = isPSS ? "RSA-PSS" : "RSASSA-PKCS1-v1_5";
  const modulusLength = alg.endsWith("512") ? 4096 : 2048;
  const kp = await window.crypto.subtle.generateKey(
    {
      name: algName,
      modulusLength,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: { name: getHashAlgorithm(alg) },
    },
    true,
    ["sign", "verify"],
  );
  const jwk = (await window.crypto.subtle.exportKey("jwk", kp.publicKey)) as {
    kty: string;
    n: string;
    e: string;
  };
  const privBuf = await window.crypto.subtle.exportKey("pkcs8", kp.privateKey);
  const privB64 = arrayBufferToBase64(privBuf);
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${formatPEM(privB64)}\n-----END PRIVATE KEY-----`;
  return {
    jwk: { kty: "RSA", n: jwk.n ?? "", e: jwk.e ?? "AQAB", alg },
    privateKeyPem,
  };
}

export async function generateEcKeyPair(
  alg: string,
): Promise<{ publicKey: string; privateKey: string }> {
  const kp = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: getEcCurve(alg) },
    true,
    ["sign", "verify"],
  );
  const pub = arrayBufferToBase64(
    await window.crypto.subtle.exportKey("spki", kp.publicKey),
  );
  const priv = arrayBufferToBase64(
    await window.crypto.subtle.exportKey("pkcs8", kp.privateKey),
  );
  return {
    publicKey: `-----BEGIN PUBLIC KEY-----\n${formatPEM(pub)}\n-----END PUBLIC KEY-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${formatPEM(priv)}\n-----END PRIVATE KEY-----`,
  };
}
