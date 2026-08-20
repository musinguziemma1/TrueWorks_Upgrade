export function normalizeEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const domain = (email.split("@")[1] ?? "").toLowerCase();
  return `${local.toLowerCase()}@${domain}`.trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function randomTokenBytes(byteLength: number): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomToken(byteLength = 32): string {
  return toBase64Url(randomTokenBytes(byteLength));
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function parseUserAgent(userAgent: string): { device: string; browser: string; os: string } {
  let device = "Desktop";
  if (/tablet|ipad/i.test(userAgent)) device = "Tablet";
  else if (/mobile|android|iphone|ipod/i.test(userAgent)) device = "Mobile";

  let browser = "Unknown browser";
  if (/edg\//i.test(userAgent)) browser = "Edge";
  else if (/opr\//i.test(userAgent)) browser = "Opera";
  else if (/chrome\//i.test(userAgent)) browser = "Chrome";
  else if (/safari\//i.test(userAgent)) browser = "Safari";
  else if (/firefox\//i.test(userAgent)) browser = "Firefox";

  let os = "Unknown OS";
  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/mac os/i.test(userAgent)) os = "macOS";
  else if (/linux/i.test(userAgent)) os = "Linux";

  return { device, browser, os };
}

export function anonymizeIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  if (ip.includes(".")) return ip.split(".").slice(0, 3).join(".") + ".0";
  if (ip.includes(":")) return ip.split(":").slice(0, 2).join(":") + ":0000";
  return "0.0.0.0";
}

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password12", "password123", "password1234",
  "123456", "1234567", "12345678", "123456789", "1234567890",
  "qwerty", "qwerty123", "111111", "121212", "666666", "696969",
  "iloveyou", "abc123", "admin", "letmein", "welcome", "monkey",
  "whatever", "passw0rd", "passw0rd!", "qazwsx", "trustno1",
  "sunshine", "dragon", "football", "baseball", "master", "superman",
  "hello123", "freedom", "secret", "shadow", "michael", "charlie",
  "aaron431", "qqww1122", "password1!", "password@123", "admin123",
  "123123", "888888", "00000000", "zaq12wsx", "asdfghjkl",
]);

export interface PasswordCheck {
  ok: boolean;
  reason?: string;
}

export function checkPasswordStrength(password: string, email?: string): PasswordCheck {
  if (typeof password !== "string" || password.length < 12) {
    return { ok: false, reason: "Password must be at least 12 characters long." };
  }
  if (password.length > 128) {
    return { ok: false, reason: "Password must be at most 128 characters long." };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: "This password is too common. Please choose a different one." };
  }
  if (email && email.trim().length > 0 && password.toLowerCase() === email.trim().toLowerCase()) {
    return { ok: false, reason: "Password cannot be the same as your email address." };
  }
  return { ok: true };
}

// JWT utilities using jose (Node runtime)
export async function generateJwt(
  payload: Record<string, unknown>,
  privateKeyPem: string,
  expiresInSec: number
): Promise<string> {
  const { SignJWT, importPKCS8 } = await import("jose");
  const key = await importPKCS8(privateKeyPem, "RS256");
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSec}s`)
    .sign(key);
}

export async function verifyJwt(
  token: string,
  publicKeyPem: string
): Promise<Record<string, unknown> | null> {
  const { jwtVerify, importSPKI } = await import("jose");
  try {
    const key = await importSPKI(publicKeyPem, "RS256");
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

export function parseJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function generateJwks(privateKeyPem: string): Promise<Record<string, unknown>> {
  const { importPKCS8, exportJWK } = await import("jose");
  const key = await importPKCS8(privateKeyPem, "RS256", { extractable: true });
  const jwk = await exportJWK(key);
  return {
    keys: [
      {
        kty: "RSA",
        use: "sig",
        alg: "RS256",
        kid: jwk.kid ?? "default",
        n: jwk.n,
        e: jwk.e,
      },
    ],
  };
}
