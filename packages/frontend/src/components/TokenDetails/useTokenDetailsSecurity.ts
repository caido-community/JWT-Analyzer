import type { TokenDetailsData } from "@/composables/useTokenDetailsState";

type Severity = "critical" | "high" | "medium" | "low" | "info";

const SEVERITY_ORDER: Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

export function getOverallSeverity(data: TokenDetailsData): Severity {
  if (data.risks.length === 0) return "info";
  let worst: Severity = "info";
  for (const r of data.risks) {
    const s = r.severity as Severity;
    if (!SEVERITY_ORDER.includes(s)) continue;

    if (SEVERITY_ORDER.indexOf(s) < SEVERITY_ORDER.indexOf(worst)) worst = s;
  }
  return worst;
}

export function countRisksBySeverity(
  data: TokenDetailsData,
  severity: string,
): number {
  return data.risks.filter((r) => r.severity === severity).length;
}

export function getSecuritySummary(data: TokenDetailsData): string {
  const criticalCount = countRisksBySeverity(data, "critical");
  const highCount = countRisksBySeverity(data, "high");
  if (criticalCount > 0) {
    return `Critical vulnerabilities detected. This token has ${criticalCount} critical and ${highCount} high severity issues that require immediate attention.`;
  }
  if (highCount > 0) {
    const concern = highCount === 1 ? "concern" : "concerns";
    return `High severity issues found. This token has ${highCount} security ${concern} that should be addressed.`;
  }
  if (countRisksBySeverity(data, "medium") > 0) {
    return "Medium severity issues detected. This token has security concerns that should be reviewed.";
  }
  if (countRisksBySeverity(data, "low") > 0) {
    return "Minor security issues found. This token has some low-severity concerns.";
  }
  return "No significant security issues detected. The token appears to follow security best practices.";
}

export function getSeverityClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-200 text-red-900 dark:bg-red-700/40 dark:text-red-100 font-medium";
    case "high":
      return "bg-orange-200 text-orange-900 dark:bg-orange-700/40 dark:text-orange-100 font-medium";
    case "medium":
      return "bg-yellow-200 text-yellow-900 dark:bg-yellow-700/40 dark:text-yellow-100 font-medium";
    case "low":
      return "bg-blue-200 text-blue-900 dark:bg-blue-700/40 dark:text-blue-100 font-medium";
    case "info":
      return "bg-indigo-200 text-indigo-900 dark:bg-indigo-700/40 dark:text-indigo-100 font-medium";
    default:
      return "bg-surface-200 text-surface-900 dark:bg-surface-700 dark:text-surface-100 font-medium";
  }
}

export function getExpirationStatusClass(data: TokenDetailsData): string {
  if (data.expStatus === "valid")
    return "text-success-500 dark:text-success-400";
  if (data.expStatus === "expired")
    return "text-danger-500 dark:text-danger-400";
  return "text-surface-500 dark:text-surface-400";
}

function isLongExpiration(exp: number | undefined): boolean {
  if (exp === undefined) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp > now && exp - now > 86400 * 30;
}

type Consideration = { text: string; class: string };

export function getSecurityConsiderations(
  data: TokenDetailsData,
): Consideration[] {
  const out: Consideration[] = [];
  const alg = data.header?.alg ?? "";
  const payload = data.payload ?? {};
  const payloadKeys = Object.keys(payload);

  if (alg === "none") {
    out.push({
      text: "Using 'none' algorithm is extremely dangerous and bypasses signature verification",
      class: "text-red-600 dark:text-red-400",
    });
  }
  if (["HS256", "HS384", "HS512"].includes(alg)) {
    out.push({
      text: "Symmetric algorithm requires careful key management",
      class: "text-orange-600 dark:text-orange-400",
    });
  }
  const header = data.header as Record<string, unknown> | undefined;
  if (
    (header?.jwk !== undefined && header?.jwk !== null) ||
    (header?.jku !== undefined && header?.jku !== null)
  ) {
    out.push({
      text: "JWK/JKU parameters present - possible signature bypass risk",
      class: "text-red-600 dark:text-red-400",
    });
  }
  if (data.payload?.exp === undefined) {
    out.push({
      text: "No expiration time - token remains valid indefinitely",
      class: "text-orange-600 dark:text-orange-400",
    });
  } else if (isLongExpiration(data.payload.exp)) {
    out.push({
      text: "Long expiration time increases risk if compromised",
      class: "text-yellow-600 dark:text-yellow-400",
    });
  }
  if (alg === "RS256") {
    out.push({
      text: "Check for algorithm confusion vulnerabilities (RS256 to HS256)",
      class: "text-yellow-600 dark:text-yellow-400",
    });
  }
  const hasPriv = payloadKeys.some(
    (k) =>
      k.toLowerCase().includes("admin") ||
      k.toLowerCase().includes("role") ||
      k.toLowerCase().includes("priv"),
  );
  if (hasPriv) {
    out.push({
      text: "Token contains privileged access claims",
      class: "text-orange-600 dark:text-orange-400",
    });
  }
  return out;
}
