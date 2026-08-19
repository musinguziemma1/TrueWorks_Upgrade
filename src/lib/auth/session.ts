"use client";

const SESSION_COOKIE = "tw_session";
const CSRF_COOKIE = "tw_csrf";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function getSessionCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function setSessionCookie(value: string, maxAge = SESSION_MAX_AGE): void {
  const isSecure = window.location.protocol === "https:";
  const cookie = `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Strict${isSecure ? "; Secure" : ""}`;
  document.cookie = cookie;
}

export function clearSessionCookie(): void {
  const cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
  document.cookie = cookie;
}

export function getCsrfCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function setCsrfCookie(): void {
  const token = crypto.randomUUID();
  const cookie = `${CSRF_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Strict`;
  document.cookie = cookie;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const csrf = getCsrfCookie();
  const headers = new Headers(init.headers);
  if (csrf) headers.set("x-tw-csrf", csrf);
  return fetch(input, { ...init, headers, credentials: "include" });
}
