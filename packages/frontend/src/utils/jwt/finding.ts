import type { Finding, JWTHeader, JWTPayload, JWTRisk, Severity } from "shared";

const SEVERITY_ORDER: Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

function getHighestSeverity(risks: JWTRisk[]): Severity {
  if (risks.length === 0) return "info";
  let worst: Severity = "info";
  for (const r of risks) {
    const s = r.severity;
    if (SEVERITY_ORDER.indexOf(s) < SEVERITY_ORDER.indexOf(worst)) worst = s;
  }
  return worst;
}

function formatTimestamp(unix: number): string {
  return (
    new Date(unix * 1000).toISOString().slice(0, 19).replace("T", " ") + " UTC"
  );
}

type ExpInfo = {
  expStatus: "valid" | "expired" | "not_yet_valid";
  timeLeft: string;
};

function computeExpInfo(payload: JWTPayload): ExpInfo {
  const { exp, nbf } = payload;
  if (exp === undefined) return { expStatus: "valid", timeLeft: "No expiry" };

  const now = Math.floor(Date.now() / 1000);

  if (nbf !== undefined && now < nbf) {
    return { expStatus: "not_yet_valid", timeLeft: "Not yet valid" };
  }

  const diff = exp - now;
  if (diff < 0) {
    const days = Math.floor(-diff / 86400);
    return {
      expStatus: "expired",
      timeLeft: `Expired ${days} day${days !== 1 ? "s" : ""} ago`,
    };
  }

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  return { expStatus: "valid", timeLeft: `Expires in ${label}` };
}

export function buildFinding(
  token: string,
  header: JWTHeader,
  payload: JWTPayload,
  risks: JWTRisk[],
  suggestions: string[],
  source: "request" | "response" | "manual",
): Finding {
  const severity = getHighestSeverity(risks);
  const { expStatus, timeLeft } = computeExpInfo(payload);
  const aud = payload.aud;
  const audience = Array.isArray(aud) ? aud.join(", ") : aud;

  return {
    id: `jwt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `JWT Token - ${header.alg ?? "unknown"}`,
    severity,
    metadata: {
      token,
      header,
      payload,
      expStatus,
      risks,
      suggestions,
      issuedAt:
        payload.iat !== undefined ? formatTimestamp(payload.iat) : "Unknown",
      expiresAt:
        payload.exp !== undefined ? formatTimestamp(payload.exp) : "Never",
      timeLeft,
      issuer: payload.iss,
      subject: payload.sub,
      audience,
      source,
      severity,
    },
  };
}
