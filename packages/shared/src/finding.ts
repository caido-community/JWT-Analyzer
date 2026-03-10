import type { JWTHeader, JWTPayload } from "./jwt";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type JWTRisk = {
  type: string;
  severity: Severity;
  description: string;
  impact: string;
};

export type JWTAnalysisResult = {
  risks: JWTRisk[];
  suggestions: string[];
};

export type FindingMetadata = {
  token: string;
  header: JWTHeader;
  payload: JWTPayload;
  expStatus: "valid" | "expired" | "not_yet_valid";
  risks: JWTRisk[];
  suggestions: string[];
  issuedAt: string;
  expiresAt: string;
  timeLeft: string;
  issuer?: string;
  subject?: string;
  audience?: string;
  source: "request" | "response" | "manual";
  severity: Severity;
};

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  metadata: FindingMetadata;
};
