import type { CaidoBackendSDK, Finding, JWTHeader, JWTPayload } from "../types";
import { decodeBase64Url, formatTimestamp, getTimeLeft } from "../utils/jwtUtils";
import { analyzeJWTSecurity } from "./securityAnalyzer";

/**
 * Process a JWT token and create a finding
 */
export async function processToken(
  sdk: CaidoBackendSDK, 
  token: string, 
  requestId: string, 
  source: 'request' | 'response' | 'manual'
): Promise<Finding> {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error("Invalid JWT format: missing parts");
    }
    
    const header = decodeBase64Url(parts[0] || '');
    const payload = decodeBase64Url(parts[1] || '');

    if (!header || !payload) {
      throw new Error("Invalid JWT: could not decode header or payload");
    }

    const { risks, suggestions } = analyzeJWTSecurity(header, payload);
    
    const now = Math.floor(Date.now() / 1000);
    const expStatus = payload.exp && payload.exp < now ? 'expired' : 'valid';
    
    // Get highest severity
    let highestSeverity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
    if (risks.some(r => r.severity === 'critical')) highestSeverity = 'critical';
    else if (risks.some(r => r.severity === 'high')) highestSeverity = 'high';
    else if (risks.some(r => r.severity === 'medium')) highestSeverity = 'medium';
    else if (risks.some(r => r.severity === 'low')) highestSeverity = 'low';
    
    const issuedAt = payload.iat ? formatTimestamp(payload.iat) : 'Not specified';
    const expiresAt = payload.exp ? formatTimestamp(payload.exp) : 'Not specified';
    const timeLeft = payload.exp ? getTimeLeft(payload.exp) : 'No expiration';
    const issuer = payload.iss || 'Not specified';
    const subject = payload.sub || 'Not specified';
    const audience = payload.aud ? (Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud) : 'Not specified';
    
    // Create short summary for the finding title
    let titlePrefix = highestSeverity === 'info' ? 'JWT Token' : 
                     `${highestSeverity.charAt(0).toUpperCase() + highestSeverity.slice(1)} JWT Issues`;
    
    // Create description with key findings
    let description = `JWT token detected in ${source}.\n\n`;
    description += `Algorithm: ${header.alg || 'Not specified'}\n`;
    description += `Issuer: ${issuer}\n`;
    description += `Subject: ${subject}\n`;
    description += `Expiration: ${expiresAt} (${timeLeft})\n\n`;
    
    if (risks.length > 0) {
      description += 'Risks:\n';
      risks.forEach(risk => {
        description += `• ${risk.description} (${risk.severity})\n`;
      });
    }

    if (suggestions.length > 0) {
      description += '\nSuggestions:\n';
      suggestions.forEach(suggestion => {
        description += `• ${suggestion}\n`;
      });
    }

    // Create the finding
    const finding: Finding = {
      id: `jwt-${token.substring(0, 20)}-${Date.now()}`,
      title: `${titlePrefix} in ${source.charAt(0).toUpperCase() + source.slice(1)}`,
      severity: highestSeverity,
      metadata: {
        severity: highestSeverity,
        token,
        header,
        payload,
        expStatus,
        risks,
        suggestions,
        issuedAt,
        expiresAt,
        timeLeft,
        issuer,
        subject,
        audience,
        source
      }
    };

    // Create the Caido finding
    await sdk.findings.create({
      title: finding.title,
      description,
      type: "JWT Token",
      reporter: "JWT Analyzer",
      dedupeKey: `jwt-${token.substring(0, 20)}`,
      request: requestId,
      metadata: finding.metadata
    });
    
    // Log success to console
    // Backend log:(`JWT token detected in ${source} with ${risks.length} risks`);

    // Return the finding
    return finding;
  } catch (error) {
    // Log error safely
    if (error instanceof Error) {
      sdk.console.error(`Error processing token: ${error.message}`);
      throw error;
    } else {
      const genericError = new Error(`Error processing token`);
      sdk.console.error(genericError.message);
      throw genericError;
    }
  }
} 