import type { JWTHeader, JWTPayload } from "shared";

function safeAtob(str: string): string {
  return atob(str);
}

function urlDecodeBase64(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);
  return str;
}

export function decodeJWT(token: string):
  | {
      header: JWTHeader;
      payload: JWTPayload;
      signature: string;
    }
  | undefined {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return undefined;
    const [rawHeader, rawPayload, signature] = parts;
    if (
      rawHeader === undefined ||
      rawPayload === undefined ||
      signature === undefined
    )
      return undefined;
    const header = JSON.parse(
      safeAtob(urlDecodeBase64(rawHeader)),
    ) as JWTHeader;
    const payload = JSON.parse(
      safeAtob(urlDecodeBase64(rawPayload)),
    ) as JWTPayload;
    return { header, payload, signature };
  } catch {
    return undefined;
  }
}
