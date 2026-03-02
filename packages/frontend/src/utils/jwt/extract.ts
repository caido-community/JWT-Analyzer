const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\b/g;

// Find all candidate JWT strings in arbitrary text (headers, body, query, etc.).
export function extractJWTs(text: string): string[] {
  const matches = text.match(JWT_PATTERN);
  if (!matches) return [];
  return [...new Set(matches)];
}

// Return true if the raw HTTP string contains at least one JWT.
export function hasJWT(raw: string): boolean {
  return JWT_PATTERN.test(raw);
}
