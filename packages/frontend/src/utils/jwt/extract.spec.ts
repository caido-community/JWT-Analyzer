import { describe, expect, it } from "vitest";

import { extractJWTs, hasJWT } from "./extract";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const HEADER_RAW = `GET /api/user HTTP/1.1\r\nAuthorization: Bearer ${SAMPLE_JWT}\r\nHost: example.com\r\n\r\n`;

describe("extractJWTs", () => {
  it("finds a JWT in an Authorization header", () => {
    const result = extractJWTs(HEADER_RAW);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(SAMPLE_JWT);
  });

  it("finds a JWT in plain text", () => {
    expect(extractJWTs(`token=${SAMPLE_JWT}&foo=bar`)).toContain(SAMPLE_JWT);
  });

  it("returns empty array when no JWT present", () => {
    expect(extractJWTs("hello world no jwt here")).toHaveLength(0);
  });

  it("deduplicates repeated JWTs", () => {
    const result = extractJWTs(`${SAMPLE_JWT} ${SAMPLE_JWT}`);
    expect(result).toHaveLength(1);
  });
});

describe("hasJWT", () => {
  it("returns true when a JWT is present", () => {
    expect(hasJWT(HEADER_RAW)).toBe(true);
  });

  it("returns false when no JWT is present", () => {
    expect(hasJWT("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n")).toBe(false);
  });
});
