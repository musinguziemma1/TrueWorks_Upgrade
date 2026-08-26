"use client";

import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

/**
 * Client helpers for the passkey (WebAuthn) flows. All requests go through
 * the /api/auth proxy so the Origin header and cookies are handled uniformly.
 */

export interface PasskeySummary {
  id: string;
  name?: string;
  deviceType?: string;
  backedUp?: boolean;
  lastUsedAt?: number;
  createdAt: number;
}

/** Register a new passkey for the currently signed-in user. */
export async function registerPasskey(name?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const optionsRes = await fetch("/api/auth/passkeys/register/options", { method: "POST" });
    if (!optionsRes.ok) {
      const data = await optionsRes.json().catch(() => ({}));
      return { ok: false, error: typeof data.error === "string" ? data.error : "Could not start passkey registration." };
    }
    const { options } = await optionsRes.json();

    const attRes = await startRegistration({ optionsJSON: options });

    const verifyRes = await fetch("/api/auth/passkeys/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: attRes, name }),
    });
    const data = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) {
      return { ok: false, error: typeof data.error === "string" ? data.error : "Passkey verification failed." };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && /NotAllowedError/i.test(error.name ?? "")) {
      return { ok: false, error: "Passkey registration was cancelled." };
    }
    return { ok: false, error: "This device or browser doesn't support passkeys." };
  }
}

/** Sign in with a passkey. `email` scopes the challenge when provided. */
export async function signInWithPasskey(email?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const optionsRes = await fetch("/api/auth/passkeys/auth/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email ?? undefined }),
    });
    if (!optionsRes.ok) {
      const data = await optionsRes.json().catch(() => ({}));
      return { ok: false, error: typeof data.error === "string" ? data.error : "Could not start passkey sign-in." };
    }
    const { options } = await optionsRes.json();

    const attRes = await startAuthentication({ optionsJSON: options });

    const verifyRes = await fetch("/api/auth/passkeys/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: attRes }),
    });
    const data = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) {
      return { ok: false, error: typeof data.error === "string" ? data.error : "Passkey sign-in failed." };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && /NotAllowedError/i.test(error.name ?? "")) {
      return { ok: false, error: "Passkey sign-in was cancelled." };
    }
    return { ok: false, error: "This device or browser doesn't support passkeys." };
  }
}

/** List the current user's registered passkeys. */
export async function listPasskeys(): Promise<PasskeySummary[]> {
  const res = await fetch("/api/auth/passkeys");
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data.passkeys) ? data.passkeys : [];
}

/** Delete one of the current user's passkeys. */
export async function deletePasskey(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/auth/passkeys/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: typeof data.error === "string" ? data.error : "Could not delete passkey." };
  }
  return { ok: true };
}
