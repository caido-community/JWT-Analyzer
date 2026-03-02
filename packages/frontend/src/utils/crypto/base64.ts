export function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToArrayBuffer(b64url: string): ArrayBuffer {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(b64 + pad);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    const b = bytes[i];
    if (b !== undefined) bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

export function signatureToBase64Url(buf: ArrayBuffer): string {
  return arrayBufferToBase64(buf)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function formatPEM(base64: string): string {
  return base64.match(/.{1,64}/g)?.join("\n") ?? base64;
}
