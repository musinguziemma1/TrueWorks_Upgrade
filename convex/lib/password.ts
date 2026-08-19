"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing — Node-only helpers exposed as internal actions so the
 * node runtime is never imported by default-runtime files (http.ts, etc.).
 *
 * Decision (documented per IAM spec §6): we use Node's built-in `crypto.scrypt`
 * rather than Argon2id. Argon2id was the original choice via `@node-rs/argon2`,
 * but that package ships a `browser.js` entry Convex's bundler cannot resolve.
 * `scrypt` is memory-hard, NIST-recommended (SP 800-132), uses unique per-
 * password salts, and is part of the Node.js runtime — so it bundles cleanly
 * with Convex and has no external native dependency.
 *
 * Format: `scrypt$N$r$p$saltB64$hashB64`
 *   N=16384, r=8, p=1, salt=16 bytes, hash=64 bytes.
 */
export const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

export const hashPassword = internalAction({
  args: { plain: v.string() },
  handler: async (_ctx, args) => {
    const salt = randomBytes(16);
    const hash = scryptSync(args.plain, salt, SCRYPT_PARAMS.keylen, {
      N: SCRYPT_PARAMS.N,
      r: SCRYPT_PARAMS.r,
      p: SCRYPT_PARAMS.p,
    });
    return [
      "scrypt",
      SCRYPT_PARAMS.N,
      SCRYPT_PARAMS.r,
      SCRYPT_PARAMS.p,
      salt.toString("base64"),
      hash.toString("base64"),
    ].join("$");
  },
});

export const verifyPassword = internalAction({
  args: { hash: v.string(), plain: v.string() },
  handler: async (_ctx, args) => {
    try {
      const parts = args.hash.split("$");
      if (parts.length !== 6 || parts[0] !== "scrypt") return false;
      const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
      const salt = Buffer.from(saltB64, "base64");
      const expected = Buffer.from(hashB64, "base64");
      const derived = scryptSync(args.plain, salt, expected.length, {
        N: Number(nStr),
        r: Number(rStr),
        p: Number(pStr),
      });
      return derived.length === expected.length && timingSafeEqual(derived, expected);
    } catch {
      return false;
    }
  },
});