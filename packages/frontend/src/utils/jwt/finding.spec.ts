import { describe, expect, it } from "vitest";

import { buildFinding } from "./finding";

describe("buildFinding", () => {
  const header = { alg: "RS256", kid: "key-1" };
  const risks = [
    {
      type: "test",
      severity: "high" as const,
      description: "High risk",
      impact: "High impact",
    },
  ];
  const suggestions = ["Fix it"];

  it("produces a Finding with required fields", () => {
    const payload = { sub: "user1", iss: "https://issuer.example" };
    const finding = buildFinding(
      "token.here.sig",
      header,
      payload,
      risks,
      suggestions,
      "manual",
    );
    expect(finding.id).toMatch(/^jwt-\d+-[a-z0-9]+$/);
    expect(finding.title).toBe("JWT Token - RS256");
    expect(finding.severity).toBe("high");
    expect(finding.metadata.token).toBe("token.here.sig");
    expect(finding.metadata.header).toEqual(header);
    expect(finding.metadata.payload).toEqual(payload);
    expect(finding.metadata.risks).toEqual(risks);
    expect(finding.metadata.suggestions).toEqual(suggestions);
    expect(finding.metadata.source).toBe("manual");
    expect(finding.metadata.issuer).toBe("https://issuer.example");
    expect(finding.metadata.subject).toBe("user1");
  });

  it("uses highest severity from risks", () => {
    const multipleRisks = [
      { type: "a", severity: "low" as const, description: "L", impact: "L" },
      {
        type: "b",
        severity: "critical" as const,
        description: "C",
        impact: "C",
      },
      { type: "c", severity: "medium" as const, description: "M", impact: "M" },
    ];
    const finding = buildFinding("t", header, {}, multipleRisks, [], "request");
    expect(finding.severity).toBe("critical");
    expect(finding.metadata.severity).toBe("critical");
  });

  it("defaults severity to info when no risks", () => {
    const finding = buildFinding("t", header, {}, [], [], "response");
    expect(finding.severity).toBe("info");
    expect(finding.metadata.severity).toBe("info");
  });

  it("sets expStatus and timeLeft when exp is missing", () => {
    const finding = buildFinding("t", header, { sub: "u" }, [], [], "manual");
    expect(finding.metadata.expStatus).toBe("valid");
    expect(finding.metadata.timeLeft).toBe("No expiry");
    expect(finding.metadata.expiresAt).toBe("Never");
  });

  it("sets expStatus expired when exp is in the past", () => {
    const past = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
    const finding = buildFinding(
      "t",
      header,
      { exp: past, iat: past - 3600 },
      [],
      [],
      "request",
    );
    expect(finding.metadata.expStatus).toBe("expired");
    expect(finding.metadata.timeLeft).toMatch(/Expired .* ago/);
    expect(finding.metadata.issuedAt).not.toBe("Unknown");
    expect(finding.metadata.expiresAt).not.toBe("Never");
  });

  it("sets expStatus valid when exp is in the future", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const finding = buildFinding(
      "t",
      header,
      { exp: future },
      [],
      [],
      "response",
    );
    expect(finding.metadata.expStatus).toBe("valid");
    expect(finding.metadata.timeLeft).toMatch(/Expires in/);
  });

  it("sets expStatus not_yet_valid when nbf is in the future", () => {
    const futureNbf = Math.floor(Date.now() / 1000) + 3600;
    const futureExp = futureNbf + 7200;
    const finding = buildFinding(
      "t",
      header,
      { nbf: futureNbf, exp: futureExp },
      [],
      [],
      "manual",
    );
    expect(finding.metadata.expStatus).toBe("not_yet_valid");
    expect(finding.metadata.timeLeft).toBe("Not yet valid");
  });

  it("formats audience array as comma-separated string", () => {
    const finding = buildFinding(
      "t",
      header,
      { aud: ["a", "b"] },
      [],
      [],
      "manual",
    );
    expect(finding.metadata.audience).toBe("a, b");
  });

  it("uses title from header.alg", () => {
    const finding = buildFinding("t", { alg: "HS256" }, {}, [], [], "manual");
    expect(finding.title).toBe("JWT Token - HS256");
  });
});
