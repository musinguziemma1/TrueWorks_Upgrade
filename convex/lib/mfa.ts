"use node";

import { sha256Hex } from "./tokens";
import { generateSecret, verify } from "otplib";

export function generateBase32Secret(): string {
  return generateSecret({ length: 20 });
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let code = "";
    for (let j = 0; j < 8; j++) code += chars[bytes[j] % chars.length];
    codes.push(code);
  }
  return codes;
}

export async function hashRecoveryCode(code: string): Promise<string> {
  return await sha256Hex(code.toUpperCase());
}

export async function verifyRecoveryCode(
  code: string,
  expectedHash: string
): Promise<boolean> {
  const inputHash = await sha256Hex(code.toUpperCase().trim());
  if (inputHash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < inputHash.length; i++) {
    diff |= inputHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  try {
    const result = await verify({ token, secret });
    return result.valid === true;
  } catch {
    return false;
  }
}
