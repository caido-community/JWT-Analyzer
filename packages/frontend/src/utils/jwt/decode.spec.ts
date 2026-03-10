import { describe, expect, it } from "vitest";

import { decodeJWT } from "./decode";

describe("decodeJWT", () => {
  it("returns undefined for empty string", () => {
    expect(decodeJWT("")).toBeUndefined();
  });

  it("returns undefined for non-JWT string", () => {
    expect(decodeJWT("not-a-jwt")).toBeUndefined();
    expect(decodeJWT("one.two")).toBeUndefined();
    expect(decodeJWT("a.b.c.d")).toBeUndefined();
  });

  it("returns undefined for invalid base64 in header", () => {
    expect(decodeJWT("!!!.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig")).toBeUndefined();
  });

  function toBase64Url(s: string): string {
    const base64 =
      typeof Buffer !== "undefined"
        ? Buffer.from(s, "utf-8").toString("base64")
        : btoa(unescape(encodeURIComponent(s)));
    return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }

  it("decodes a valid JWT with minimal header and payload", () => {
    const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = toBase64Url(JSON.stringify({ sub: "1234567890" }));
    const token = `${header}.${payload}.signature`;
    const result = decodeJWT(token);
    expect(result).toBeDefined();
    expect(result?.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result?.payload).toEqual({ sub: "1234567890" });
    expect(result?.signature).toBe("signature");
  });

  it("decodes base64url (with - and _)", () => {
    const token = `${toBase64Url(JSON.stringify({ alg: "RS256" }))}.${toBase64Url(JSON.stringify({ iss: "test" }))}.sig`;
    const result = decodeJWT(token);
    expect(result).toBeDefined();
    expect(result?.header.alg).toBe("RS256");
    expect(result?.payload.iss).toBe("test");
    expect(result?.signature).toBe("sig");
  });

  it("returns undefined when payload is not valid JSON", () => {
    const header = toBase64Url(JSON.stringify({ alg: "HS256" }));
    const badPayload = toBase64Url("not-json");
    const token = `${header}.${badPayload}.sig`;
    expect(decodeJWT(token)).toBeUndefined();
  });
});
