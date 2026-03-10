const SYMMETRIC_ALGORITHMS = ["HS256", "HS384", "HS512"] as const;
const RSA_ALGORITHMS = [
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
] as const;
const EC_ALGORITHMS = ["ES256", "ES384", "ES512"] as const;

export function getHashAlgorithm(alg: string): string {
  if (alg.includes("256")) return "SHA-256";
  if (alg.includes("384")) return "SHA-384";
  return "SHA-512";
}

export function isSymmetricAlgorithm(alg: string | undefined): boolean {
  if (alg === undefined || alg === "") return false;
  return (SYMMETRIC_ALGORITHMS as readonly string[]).includes(alg);
}

export function isRsaAlgorithm(alg: string | undefined): boolean {
  if (alg === undefined || alg === "") return false;
  return (RSA_ALGORITHMS as readonly string[]).includes(alg);
}

export function isEcAlgorithm(alg: string | undefined): boolean {
  if (alg === undefined || alg === "") return false;
  return (EC_ALGORITHMS as readonly string[]).includes(alg);
}

export function isAsymmetricAlgorithm(alg: string | undefined): boolean {
  return isRsaAlgorithm(alg) || isEcAlgorithm(alg);
}

export function getWebCryptoName(alg: string): string {
  if (alg.startsWith("HS")) return "HMAC";
  if (alg.startsWith("PS")) return "RSA-PSS";
  if (alg.startsWith("RS")) return "RSASSA-PKCS1-v1_5";
  if (alg.startsWith("ES")) return "ECDSA";
  return "HMAC";
}

export function getEcCurve(alg: string): string {
  if (alg === "ES384") return "P-384";
  if (alg === "ES512") return "P-521";
  return "P-256";
}

export function getSignatureTypeLabel(alg: string | undefined): string {
  if (alg === undefined || alg === "") return "Unknown";
  if (alg === "none") return "None (Unsigned)";
  if (isSymmetricAlgorithm(alg)) return "Symmetric (HMAC)";
  if (alg.startsWith("RS") || alg.startsWith("PS")) return "Asymmetric (RSA)";
  if (alg.startsWith("ES")) return "Asymmetric (ECDSA)";
  return "Unknown";
}

export function getAlgorithmOptions(): { label: string; value: string }[] {
  return [
    ...SYMMETRIC_ALGORITHMS.map((a) => ({ label: a, value: a })),
    ...RSA_ALGORITHMS.map((a) => ({ label: a, value: a })),
    ...EC_ALGORITHMS.map((a) => ({ label: a, value: a })),
  ];
}
