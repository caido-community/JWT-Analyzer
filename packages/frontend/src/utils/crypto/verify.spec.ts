import { describe, expect, it } from "vitest";

import {
  verifyECDSASignature,
  verifyHMACSignature,
  verifyRSASignature,
} from "./verify";

const hasSubtle =
  typeof window !== "undefined" &&
  typeof (window as unknown as { crypto?: { subtle?: unknown } }).crypto
    ?.subtle === "object";

describe("verifyHMACSignature", () => {
  it("returns isValid: false for invalid base64 signature", async () => {
    const result = await verifyHMACSignature(
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0",
      "!!!invalid!!!",
      "secret",
      "HS256",
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns isValid: false when data does not match signature", async () => {
    const tamperedData = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0YW1wZXJlZCJ9";
    const sig = "dGhpcy1pcy1ub3QtYS1yZWFsLXNpZ25hdHVyZQ"; // valid base64url
    const result = await verifyHMACSignature(
      tamperedData,
      sig,
      "secret",
      "HS256",
    );
    expect(result.isValid).toBe(false);
  });
});

describe("verifyRSASignature", () => {
  it("returns isValid: false for invalid PEM", async () => {
    const result = await verifyRSASignature(
      "data",
      "c2ln",
      "not-valid-pem",
      "RS256",
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("verifyECDSASignature", () => {
  it("returns isValid: false for invalid PEM", async () => {
    const result = await verifyECDSASignature(
      "data",
      "c2ln",
      "not-valid-pem",
      "ES256",
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("verify roundtrip (with sign)", () => {
  it.skipIf(!hasSubtle)(
    "HMAC: valid signature returns isValid: true",
    async () => {
      const { signHMAC } = await import("./sign");
      const data = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
      const secret = "my-secret";
      const sig = await signHMAC(data, secret, "HS256");
      const result = await verifyHMACSignature(data, sig, secret, "HS256");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    },
  );

  it.skipIf(!hasSubtle)(
    "RSA: valid signature returns isValid: true",
    async () => {
      const { generateRsaKeyPair } = await import("./keys");
      const { signRSA } = await import("./sign");
      const { publicKey, privateKey } = await generateRsaKeyPair("RS256");
      const data = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
      const sig = await signRSA(data, privateKey, "RS256");
      const result = await verifyRSASignature(data, sig, publicKey, "RS256");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    },
  );
});
