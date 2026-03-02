import { describe, expect, it } from "vitest";

import {
  arrayBufferToBase64,
  base64UrlToArrayBuffer,
  formatPEM,
  signatureToBase64Url,
  toBase64Url,
} from "./base64";

describe("toBase64Url", () => {
  it("encodes a simple string", () => {
    expect(toBase64Url('{"alg":"HS256"}')).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("strips padding characters", () => {
    const result = toBase64Url("hello");
    expect(result).not.toContain("=");
  });

  it("replaces + with - and / with _", () => {
    const result = toBase64Url("hello world!");
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
  });

  it("is reversible via atob after padding restore", () => {
    const original = '{"alg":"RS256","typ":"JWT"}';
    const encoded = toBase64Url(original);
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    expect(atob(b64 + pad)).toBe(original);
  });
});

describe("base64UrlToArrayBuffer", () => {
  it("converts base64url to ArrayBuffer", () => {
    const b64url = toBase64Url("test");
    const buf = base64UrlToArrayBuffer(b64url);
    expect(buf).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(buf).length).toBe(4);
  });

  it("handles - and _ characters", () => {
    const b64url = "SGVsbG8-V29ybGQ_";
    const buf = base64UrlToArrayBuffer(b64url);
    expect(buf).toBeInstanceOf(ArrayBuffer);
  });

  it("round-trips correctly", () => {
    const original = "hello world";
    const encoded = toBase64Url(original);
    const buf = base64UrlToArrayBuffer(encoded);
    const decoded = String.fromCharCode(...new Uint8Array(buf));
    expect(decoded).toBe(original);
  });
});

describe("arrayBufferToBase64", () => {
  it("converts ArrayBuffer to base64 string", () => {
    const bytes = new Uint8Array([104, 101, 108, 108, 111]);
    const result = arrayBufferToBase64(bytes.buffer);
    expect(result).toBe(btoa("hello"));
  });

  it("returns a valid base64 string", () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 255]);
    const result = arrayBufferToBase64(bytes.buffer);
    expect(() => atob(result)).not.toThrow();
  });
});

describe("signatureToBase64Url", () => {
  it("converts signature buffer to base64url (no padding, no +/)", () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xfe]);
    const result = signatureToBase64Url(bytes.buffer);
    expect(result).not.toContain("=");
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
  });
});

describe("formatPEM", () => {
  it("wraps long base64 at 64-char lines", () => {
    const long = "A".repeat(128);
    const formatted = formatPEM(long);
    const lines = formatted.split("\n");
    expect(lines.every((l) => l.length <= 64)).toBe(true);
    expect(lines.length).toBe(2);
  });

  it("handles short strings without adding newlines", () => {
    expect(formatPEM("short")).toBe("short");
  });
});
