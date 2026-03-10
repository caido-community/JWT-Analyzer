import { describe, expect, it } from "vitest";

import { generateRsaKeyPair } from "./keys";
import { signHMAC, signRSA } from "./sign";
import { verifyHMACSignature, verifyRSASignature } from "./verify";

const hasSubtle =
  typeof window !== "undefined" &&
  typeof (window as unknown as { crypto?: { subtle?: unknown } }).crypto
    ?.subtle === "object";

describe("sign + verify roundtrip", () => {
  it.skipIf(!hasSubtle)(
    "HMAC: signed payload verifies with same secret (HS256)",
    async () => {
      const data = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
      const secret = "my-secret";
      const sig = await signHMAC(data, secret, "HS256");
      expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
      const result = await verifyHMACSignature(data, sig, secret, "HS256");
      expect(result.isValid).toBe(true);
    },
  );

  it.skipIf(!hasSubtle)("HMAC: wrong secret fails verification", async () => {
    const data = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
    const sig = await signHMAC(data, "secret1", "HS256");
    const result = await verifyHMACSignature(data, sig, "secret2", "HS256");
    expect(result.isValid).toBe(false);
  });

  it.skipIf(!hasSubtle)(
    "RSA: signed payload verifies with same key pair (RS256)",
    async () => {
      const { publicKey, privateKey } = await generateRsaKeyPair("RS256");
      const data = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
      const sig = await signRSA(data, privateKey, "RS256");
      expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
      const result = await verifyRSASignature(data, sig, publicKey, "RS256");
      expect(result.isValid).toBe(true);
    },
  );
});
