import type { JWTHeader, JWTPayload, JWTRisk } from "shared";

type Severity = JWTRisk["severity"];

function risk(
  type: string,
  severity: Severity,
  description: string,
  impact: string,
): JWTRisk {
  return { type, severity, description, impact };
}

export function analyzeJWTSecurity(
  header: JWTHeader,
  payload: JWTPayload,
): { risks: JWTRisk[]; suggestions: string[] } {
  const risks: JWTRisk[] = [];
  const suggestions: string[] = [];
  const now = Math.floor(Date.now() / 1000);

  if (header.alg === undefined || header.alg === "") {
    risks.push(
      risk(
        "algorithm",
        "critical",
        "No algorithm specified in header",
        "Allows attackers to potentially bypass signature verification by manipulating the algorithm",
      ),
    );
    suggestions.push("Specify a secure JWT algorithm in the header");
  } else if (header.alg === "none") {
    risks.push(
      risk(
        "algorithm",
        "critical",
        'Algorithm set to "none" - signature verification is bypassed',
        "Attacker can modify the token payload without invalidating the signature",
      ),
    );
    suggestions.push("Use a secure algorithm like RS256 or ES256");
    suggestions.push('Explicitly reject tokens with "none" algorithm');
  } else if (["HS256", "HS384", "HS512"].includes(header.alg)) {
    risks.push(
      risk(
        "algorithm",
        "medium",
        "Using symmetric algorithm - same key for signing and verification",
        "If verification key is exposed, attackers can forge new valid tokens",
      ),
    );
    suggestions.push(
      "Consider using asymmetric algorithms like RS256 or ES256 for better security isolation",
    );
    suggestions.push(
      "Ensure symmetric keys are strong (at least 256 bits) and regularly rotated",
    );
  }

  if (header.jwk !== undefined) {
    risks.push(
      risk(
        "header",
        "critical",
        'Token contains "jwk" parameter in header',
        "Attacker can supply their own public key in the header, allowing them to forge valid signatures",
      ),
    );
    suggestions.push('Do not accept "jwk" parameters in JWT headers');
    suggestions.push(
      "Implement a whitelist of trusted keys on the server side",
    );
  }
  if (header.jku !== undefined) {
    risks.push(
      risk(
        "header",
        "critical",
        'Token contains "jku" parameter in header',
        "Attacker can point to malicious JWKS URLs, enabling SSRF or key injection",
      ),
    );
    suggestions.push('Do not accept "jku" parameters from untrusted sources');
    suggestions.push(
      "Implement a whitelist of trusted JWKS URLs on the server side",
    );
  }

  const kid = header.kid;
  if (typeof kid === "string") {
    if (kid.includes("../") || kid.includes("..\\")) {
      risks.push(
        risk(
          "header",
          "critical",
          'Token contains path traversal patterns in "kid" parameter',
          "Can lead to directory traversal attacks if improperly handled server-side",
        ),
      );
      suggestions.push(
        'Validate and sanitize the "kid" parameter to prevent path traversal',
      );
    }
    if (
      kid.includes("'") ||
      kid.includes('"') ||
      kid.includes("=") ||
      kid.includes(";")
    ) {
      risks.push(
        risk(
          "header",
          "critical",
          'Token contains potentially injectable characters in "kid" parameter',
          'May allow SQL injection or command injection if server uses "kid" in queries',
        ),
      );
      suggestions.push(
        'Implement strict input validation for the "kid" parameter',
      );
    }
  }

  if (header.alg === "RS256") {
    risks.push(
      risk(
        "algorithm",
        "high",
        "Potential vulnerability to algorithm confusion (RS256 to HS256)",
        "If JWT library accepts algorithm changes without validation, attacker can force verification with public key as HMAC secret",
      ),
    );
    suggestions.push(
      "Explicitly verify the algorithm used in tokens and enforce the expected algorithm",
    );
  }

  if (header.typ === undefined) {
    risks.push(
      risk(
        "header",
        "low",
        "Missing token type in header",
        "May cause interoperability issues with some JWT libraries",
      ),
    );
    suggestions.push(
      'Include "typ": "JWT" in the header for better interoperability',
    );
  } else if (header.typ !== "JWT") {
    risks.push(
      risk(
        "header",
        "low",
        `Token type is "${header.typ}" instead of "JWT"`,
        "May cause interoperability issues",
      ),
    );
  }

  if (payload.exp === undefined) {
    risks.push(
      risk(
        "claim",
        "high",
        "Token has no expiration time (exp claim)",
        "Token remains valid indefinitely if compromised, increasing the attack window",
      ),
    );
    suggestions.push("Add expiration claim (exp) to limit token lifetime");
  } else {
    const exp = payload.exp;
    if (exp < now) {
      risks.push(
        risk(
          "claim",
          "medium",
          `Token expired at ${new Date(exp * 1000).toLocaleString()}`,
          "Token should be rejected by properly implemented systems",
        ),
      );
    } else {
      const timeToExpire = exp - now;
      if (timeToExpire > 86400 * 30) {
        risks.push(
          risk(
            "claim",
            "medium",
            `Token has a long expiration time (${Math.floor(timeToExpire / 86400)} days)`,
            "Long-lived tokens provide a larger window for attackers if the token is leaked",
          ),
        );
        suggestions.push(
          "Consider using shorter token lifetimes (hours/days instead of months/years",
        );
        suggestions.push(
          "Implement token refresh mechanisms for better security",
        );
      }
    }
  }

  if (payload.nbf !== undefined && payload.nbf > now) {
    risks.push(
      risk(
        "claim",
        "medium",
        `Token not valid until ${new Date(payload.nbf * 1000).toLocaleString()}`,
        "Token should be rejected until the nbf time is reached",
      ),
    );
  }

  if (payload.iat === undefined) {
    risks.push(
      risk(
        "claim",
        "low",
        'Missing "issued at" (iat) claim',
        "Harder to track token age and implement proper token rotation policies",
      ),
    );
    suggestions.push('Add "issued at" (iat) claim for better token tracking');
  }
  if (payload.jti === undefined) {
    risks.push(
      risk(
        "claim",
        "medium",
        "Missing JWT ID (jti) claim",
        "Without a unique identifier, tokens cannot be revoked individually and are vulnerable to replay attacks",
      ),
    );
    suggestions.push(
      "Add JWT ID (jti) claim to enable token revocation and prevent replay attacks",
    );
  }
  if (payload.iss === undefined) {
    risks.push(
      risk(
        "claim",
        "medium",
        "Missing issuer (iss) claim",
        "Prevents verification of token origin, enabling cross-service token replay attacks",
      ),
    );
    suggestions.push(
      "Add issuer (iss) claim and validate it on the receiving end",
    );
  }
  if (payload.sub === undefined) {
    risks.push(
      risk(
        "claim",
        "medium",
        "Missing subject (sub) claim",
        "Harder to identify which user or entity the token represents, complicating access control",
      ),
    );
    suggestions.push("Add subject (sub) claim to identify the token subject");
  }
  if (payload.aud === undefined && header.alg !== "none") {
    risks.push(
      risk(
        "claim",
        "medium",
        "Missing audience (aud) claim",
        "Tokens can be replayed across different services that share the same signing key",
      ),
    );
    suggestions.push(
      "Include audience (aud) claim to restrict where tokens can be used",
    );
  }

  if (header.x5c !== undefined || header.x5u !== undefined) {
    risks.push(
      risk(
        "header",
        "critical",
        "Token uses X.509 certificate chain validation",
        "Vulnerable to certificate bypass attacks if validation is improperly implemented (CVE-2023-48238)",
      ),
    );
    suggestions.push(
      "Ensure proper X.509 certificate validation including chain validation and revocation checking",
    );
  }

  const sensitiveKeys = [
    "password",
    "secret",
    "private",
    "apikey",
    "api_key",
    "token",
    "credentials",
    "passwd",
    "pass",
    "key",
    "auth",
    "authz",
    "oauth",
    "access_token",
    "refresh_token",
    "client_secret",
    "hash",
    "salt",
    "credit",
    "card",
    "cvv",
    "ssn",
    "social",
  ];
  const foundSensitiveKeys = Object.keys(payload).filter((key) =>
    sensitiveKeys.some((s) => key.toLowerCase().includes(s)),
  );
  if (foundSensitiveKeys.length > 0) {
    risks.push(
      risk(
        "payload",
        "high",
        `Token contains potentially sensitive data keys: ${foundSensitiveKeys.join(", ")}`,
        "Sensitive data in tokens could be exposed if the token is intercepted or stored in logs",
      ),
    );
    suggestions.push("Remove sensitive information from JWT payload");
    suggestions.push(
      "Store only identifiers in JWTs, not actual sensitive data",
    );
  }

  const adminIndicators = [
    "admin",
    "root",
    "superuser",
    "administrator",
    "sudo",
    "true",
    "1",
    "yes",
  ];
  const adminKeys = Object.entries(payload).filter(([key, value]) => {
    const keyLower = key.toLowerCase();
    if (
      keyLower.includes("admin") ||
      keyLower.includes("role") ||
      keyLower.includes("priv") ||
      keyLower.includes("perm") ||
      keyLower.includes("access") ||
      keyLower.includes("right")
    ) {
      const strValue = String(value).toLowerCase();
      return adminIndicators.some((ind) => strValue.includes(ind));
    }
    return false;
  });
  if (adminKeys.length > 0) {
    risks.push(
      risk(
        "payload",
        "high",
        "Token contains administrative privileges",
        "If stolen, attacker gains administrative access to the system",
      ),
    );
    suggestions.push(
      "Ensure administrative tokens have shortest possible lifetime",
    );
  }

  if (header.alg === "HS256" && typeof payload.exp === "string") {
    risks.push(
      risk(
        "claim",
        "high",
        "Potential vulnerability to CVE-2022-21449 (Psychic Signatures)",
        "Type confusion in HS256 with string expiration time may lead to signature validation bypass in vulnerable libraries",
      ),
    );
    suggestions.push("Ensure all date values are numbers, not strings");
  }
  if (header.alg !== undefined && header.alg.startsWith("HS")) {
    risks.push(
      risk(
        "algorithm",
        "high",
        "Potential vulnerability to empty key attacks (CVE-2018-1000531)",
        "Tokens signed with empty keys may be accepted by vulnerable JWT libraries",
      ),
    );
    suggestions.push("Test for acceptance of tokens signed with empty keys");
  }
  if (header.x5u !== undefined) {
    risks.push(
      risk(
        "header",
        "critical",
        "Token contains X5U parameter (CVE-2017-18267)",
        "Remote certificate URL can lead to SSRF attacks and key injection in vulnerable libraries",
      ),
    );
    suggestions.push("Disable X5U parameter processing in JWT libraries");
  }
  if (header.crit !== undefined) {
    risks.push(
      risk(
        "header",
        "high",
        "Token contains crit parameter (CVE-2023-32681)",
        "Critical header extensions may be improperly handled by JWT libraries, potentially bypassing signature verification",
      ),
    );
    suggestions.push(
      "Verify your JWT library properly handles critical header parameters",
    );
  }
  if (
    typeof kid === "string" &&
    (kid.includes("file://") ||
      kid.includes("http://") ||
      kid.includes("https://"))
  ) {
    risks.push(
      risk(
        "header",
        "critical",
        "Key ID contains URL patterns (potential SSRF vulnerability)",
        "May trick the server into fetching remote content or reading local files",
      ),
    );
    suggestions.push(
      "Sanitize kid parameter to prevent SSRF and local file inclusion attacks",
    );
  }
  if (
    header.kty === "oct" &&
    header.alg !== undefined &&
    header.alg.startsWith("RS")
  ) {
    risks.push(
      risk(
        "header",
        "critical",
        "Key type mismatch (symmetric kty with asymmetric algorithm)",
        "May cause JWT libraries to handle the token incorrectly, potentially bypassing signature verification",
      ),
    );
    suggestions.push("Validate that key type matches the algorithm used");
  }

  if (header.alg === "RS256" || header.alg === "ES256") {
    suggestions.push(
      "Test for algorithm confusion attack by switching to HS256 and signing with the public key",
    );
  }
  if (header.kid !== undefined && header.kid.length > 0) {
    suggestions.push(
      'Test for directory traversal via kid parameter (e.g., "../../../dev/null")',
    );
  }
  if (["HS256", "HS384", "HS512"].includes(header.alg ?? "")) {
    suggestions.push(
      "Test for weak secret key with common JWT secret wordlists",
    );
    suggestions.push(
      "Use hashcat with mode 16500 to brute force the symmetric key",
    );
  }
  suggestions.push("Try fuzzing JWT header parameters with unexpected values");
  suggestions.push(
    "Test for signature verification bypass by manipulating header fields",
  );

  return { risks, suggestions };
}
