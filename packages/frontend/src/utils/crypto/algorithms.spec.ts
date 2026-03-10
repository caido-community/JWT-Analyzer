import { describe, expect, it } from "vitest";

import {
  getAlgorithmOptions,
  getEcCurve,
  getHashAlgorithm,
  getSignatureTypeLabel,
  getWebCryptoName,
  isAsymmetricAlgorithm,
  isEcAlgorithm,
  isRsaAlgorithm,
  isSymmetricAlgorithm,
} from "./algorithms";

describe("getHashAlgorithm", () => {
  it("returns SHA-256 for *256 algorithms", () => {
    expect(getHashAlgorithm("HS256")).toBe("SHA-256");
    expect(getHashAlgorithm("RS256")).toBe("SHA-256");
    expect(getHashAlgorithm("ES256")).toBe("SHA-256");
  });

  it("returns SHA-384 for *384 algorithms", () => {
    expect(getHashAlgorithm("HS384")).toBe("SHA-384");
    expect(getHashAlgorithm("RS384")).toBe("SHA-384");
  });

  it("returns SHA-512 for *512 algorithms", () => {
    expect(getHashAlgorithm("HS512")).toBe("SHA-512");
    expect(getHashAlgorithm("RS512")).toBe("SHA-512");
    expect(getHashAlgorithm("ES512")).toBe("SHA-512");
  });
});

describe("isSymmetricAlgorithm", () => {
  it("returns true for HMAC algorithms", () => {
    expect(isSymmetricAlgorithm("HS256")).toBe(true);
    expect(isSymmetricAlgorithm("HS384")).toBe(true);
    expect(isSymmetricAlgorithm("HS512")).toBe(true);
  });

  it("returns false for RSA/EC and unknown", () => {
    expect(isSymmetricAlgorithm("RS256")).toBe(false);
    expect(isSymmetricAlgorithm("ES256")).toBe(false);
    expect(isSymmetricAlgorithm("none")).toBe(false);
    expect(isSymmetricAlgorithm(undefined)).toBe(false);
  });
});

describe("isRsaAlgorithm", () => {
  it("returns true for RSA/PSS algorithms", () => {
    expect(isRsaAlgorithm("RS256")).toBe(true);
    expect(isRsaAlgorithm("PS512")).toBe(true);
  });

  it("returns false for HMAC, EC, and unknown", () => {
    expect(isRsaAlgorithm("HS256")).toBe(false);
    expect(isRsaAlgorithm("ES256")).toBe(false);
    expect(isRsaAlgorithm(undefined)).toBe(false);
  });
});

describe("isEcAlgorithm", () => {
  it("returns true for EC algorithms", () => {
    expect(isEcAlgorithm("ES256")).toBe(true);
    expect(isEcAlgorithm("ES384")).toBe(true);
    expect(isEcAlgorithm("ES512")).toBe(true);
  });

  it("returns false for non-EC", () => {
    expect(isEcAlgorithm("RS256")).toBe(false);
    expect(isEcAlgorithm("HS256")).toBe(false);
  });
});

describe("isAsymmetricAlgorithm", () => {
  it("returns true for RSA and EC", () => {
    expect(isAsymmetricAlgorithm("RS256")).toBe(true);
    expect(isAsymmetricAlgorithm("ES256")).toBe(true);
    expect(isAsymmetricAlgorithm("PS384")).toBe(true);
  });

  it("returns false for symmetric and none", () => {
    expect(isAsymmetricAlgorithm("HS256")).toBe(false);
    expect(isAsymmetricAlgorithm("none")).toBe(false);
  });
});

describe("getWebCryptoName", () => {
  it("maps HMAC algorithms", () => {
    expect(getWebCryptoName("HS256")).toBe("HMAC");
  });

  it("maps RSA-PSS algorithms", () => {
    expect(getWebCryptoName("PS256")).toBe("RSA-PSS");
  });

  it("maps RSASSA algorithms", () => {
    expect(getWebCryptoName("RS256")).toBe("RSASSA-PKCS1-v1_5");
  });

  it("maps ECDSA algorithms", () => {
    expect(getWebCryptoName("ES256")).toBe("ECDSA");
  });
});

describe("getEcCurve", () => {
  it("maps ES256 to P-256", () => expect(getEcCurve("ES256")).toBe("P-256"));
  it("maps ES384 to P-384", () => expect(getEcCurve("ES384")).toBe("P-384"));
  it("maps ES512 to P-521", () => expect(getEcCurve("ES512")).toBe("P-521"));
});

describe("getSignatureTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getSignatureTypeLabel("HS256")).toBe("Symmetric (HMAC)");
    expect(getSignatureTypeLabel("RS256")).toBe("Asymmetric (RSA)");
    expect(getSignatureTypeLabel("ES256")).toBe("Asymmetric (ECDSA)");
    expect(getSignatureTypeLabel("none")).toBe("None (Unsigned)");
    expect(getSignatureTypeLabel(undefined)).toBe("Unknown");
  });
});

describe("getAlgorithmOptions", () => {
  it("returns all 12 algorithm options", () => {
    const opts = getAlgorithmOptions();
    expect(opts.length).toBe(12);
    expect(opts.every((o) => o.label && o.value)).toBe(true);
  });
});
