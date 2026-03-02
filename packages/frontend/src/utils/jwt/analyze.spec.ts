import { describe, expect, it } from "vitest";

import { analyzeJWTSecurity } from "./analyze";

describe("analyzeJWTSecurity", () => {
  it("returns critical risk when alg is missing or empty", () => {
    const result = analyzeJWTSecurity({ alg: "" }, { sub: "user" });
    const critical = result.risks.filter((r) => r.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
    expect(critical.some((r) => r.description.includes("algorithm"))).toBe(
      true,
    );
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("returns critical risk when alg is none", () => {
    const result = analyzeJWTSecurity({ alg: "none" }, { sub: "user" });
    const critical = result.risks.filter((r) => r.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
    expect(critical.some((r) => r.description.includes("none"))).toBe(true);
    expect(result.suggestions.some((s) => s.includes("RS256"))).toBe(true);
  });

  it("returns medium risk for HS256", () => {
    const result = analyzeJWTSecurity(
      { alg: "HS256", typ: "JWT" },
      { sub: "user", exp: Math.floor(Date.now() / 1000) + 3600 },
    );
    const medium = result.risks.filter((r) => r.severity === "medium");
    expect(medium.some((r) => r.description.includes("symmetric"))).toBe(true);
  });

  it("returns high risk when exp is missing", () => {
    const result = analyzeJWTSecurity(
      { alg: "RS256", typ: "JWT" },
      { sub: "user" },
    );
    const high = result.risks.filter((r) => r.severity === "high");
    expect(
      high.some(
        (r) =>
          r.description.includes("expiration") || r.description.includes("exp"),
      ),
    ).toBe(true);
  });

  it("returns critical risk when jwk is present in header", () => {
    const result = analyzeJWTSecurity(
      { alg: "RS256", jwk: {} },
      { sub: "user" },
    );
    const critical = result.risks.filter((r) => r.severity === "critical");
    expect(critical.some((r) => r.description.includes("jwk"))).toBe(true);
  });

  it("returns critical risk for path traversal in kid", () => {
    const result = analyzeJWTSecurity(
      { alg: "RS256", kid: "../../../etc/passwd" },
      { sub: "user" },
    );
    const critical = result.risks.filter((r) => r.severity === "critical");
    expect(
      critical.some(
        (r) =>
          r.description.includes("kid") && r.description.includes("traversal"),
      ),
    ).toBe(true);
  });

  it("returns risks and suggestions with correct shape", () => {
    const result = analyzeJWTSecurity(
      { alg: "HS256", typ: "JWT" },
      { sub: "user", iss: "app", exp: Math.floor(Date.now() / 1000) + 60 },
    );
    expect(Array.isArray(result.risks)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
    for (const r of result.risks) {
      expect(r).toHaveProperty("type");
      expect(r).toHaveProperty("severity");
      expect(r).toHaveProperty("description");
      expect(r).toHaveProperty("impact");
    }
  });
});
