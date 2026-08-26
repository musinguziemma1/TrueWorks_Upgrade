import { NextRequest, NextResponse } from "next/server";

function getConvexSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  return (process.env.NEXT_PUBLIC_CONVEX_URL ?? "")
    .replace(/\.convex\.cloud\/?$/, ".convex.site")
    .replace(/\/$/, "");
}

function getIamBase(): string {
  const siteUrl = getConvexSiteUrl();
  if (!siteUrl) throw new Error("Convex site URL is not configured");
  return `${siteUrl}/iam`;
}

function forwardedHeaders(req: NextRequest, includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    cookie: req.headers.get("cookie") ?? "",
  };
  const origin = req.headers.get("origin");
  if (origin) headers.origin = origin;
  if (includeJson) headers["Content-Type"] = "application/json";
  return headers;
}

async function proxyIamResponse(res: Response): Promise<NextResponse> {
  const setCookie = res.headers.get("set-cookie");
  if (res.status === 204) {
    const response = new NextResponse(null, { status: 204 });
    if (setCookie) response.headers.set("set-cookie", setCookie);
    return response;
  }

  const rawBody = await res.text();
  let data: unknown;
  try {
    data = rawBody ? JSON.parse(rawBody) : { error: "Empty authentication response" };
  } catch {
    data = { error: rawBody || `Authentication request failed (${res.status})` };
  }
  const response = NextResponse.json(data, { status: res.status });
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/api\/auth/, "");
  
  if (pathname === "/me") {
    const res = await fetch(`${getIamBase()}/me`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  }

  if (pathname === "/security-events") {
    const res = await fetch(`${getIamBase()}/security-events`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  }

  if (pathname === "/token") {
    const res = await fetch(`${getIamBase()}/token`, {
      method: "POST",
      headers: forwardedHeaders(req),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/sessions") {
    const res = await fetch(`${getIamBase()}/sessions`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  }

  if (pathname === "/passkeys") {
    const res = await fetch(`${getIamBase()}/passkeys`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  }

  if (pathname === "/google") {
    const redirect = url.searchParams.get("redirect") ?? "/account";
    const res = await fetch(`${getIamBase()}/oauth/google?redirect=${encodeURIComponent(redirect)}`, {
      method: "GET",
      redirect: "manual",
    });
    const location = res.headers.get("location");
    if (location) {
      return NextResponse.redirect(location, { status: 302 });
    }
    return NextResponse.json(await res.json().catch(() => ({ ok: false })), { status: res.status });
  }

  if (pathname === "/google/callback") {
    const res = await fetch(`${getIamBase()}/oauth/google/callback?${url.searchParams.toString()}`, {
      method: "GET",
      redirect: "manual",
    });
    const location = res.headers.get("location");
    if (location) {
      const response = NextResponse.redirect(location, { status: 302 });
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) response.headers.set("set-cookie", setCookie);
      return response;
    }
    return proxyIamResponse(res);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/api\/auth/, "");

  const body = await req.json().catch(() => null);
  const cookie = req.headers.get("cookie") ?? "";

  if (pathname === "/token") {
    const res = await fetch(`${getIamBase()}/token`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body ?? {}),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/login") {
    const res = await fetch(`${getIamBase()}/login`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/register") {
    const res = await fetch(`${getIamBase()}/register`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (pathname === "/logout") {
    const res = await fetch(`${getIamBase()}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
        ...(req.headers.get("origin") ? { origin: req.headers.get("origin")! } : {}),
      },
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/mfa/challenge") {
    const res = await fetch(`${getIamBase()}/mfa/challenge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
        ...(req.headers.get("origin") ? { origin: req.headers.get("origin")! } : {}),
      },
      body: JSON.stringify(body),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/verify-email") {
    const res = await fetch(`${getIamBase()}/verify-email`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (pathname === "/resend-verification") {
    const res = await fetch(`${getIamBase()}/resend-verification`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (pathname === "/forgot-password") {
    const res = await fetch(`${getIamBase()}/forgot-password`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (pathname === "/reset-password") {
    const res = await fetch(`${getIamBase()}/reset-password`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (pathname === "/change-password") {
    const res = await fetch(`${getIamBase()}/change-password`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/sessions/revoke") {
    const res = await fetch(`${getIamBase()}/sessions?action=revoke&id=${encodeURIComponent(body?.id ?? "")}`, {
      method: "POST",
      headers: forwardedHeaders(req),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/sessions/revoke-others") {
    const res = await fetch(`${getIamBase()}/sessions?action=revoke-others`, {
      method: "POST",
      headers: forwardedHeaders(req),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/sessions/revoke-all") {
    const res = await fetch(`${getIamBase()}/sessions?action=revoke-all`, {
      method: "POST",
      headers: forwardedHeaders(req),
    });
    return proxyIamResponse(res);
  }

  // Passkeys (WebAuthn) — generic same-shape forwarding.
  const PASSKEY_POST_PATHS = new Set([
    "/passkeys/register/options",
    "/passkeys/register/verify",
    "/passkeys/auth/options",
    "/passkeys/auth/verify",
    "/passkeys/delete",
  ]);
  if (PASSKEY_POST_PATHS.has(pathname)) {
    const res = await fetch(`${getIamBase()}${pathname}`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body ?? {}),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/mfa/setup") {
    const res = await fetch(`${getIamBase()}/mfa/setup`, {
      method: "POST",
      headers: forwardedHeaders(req),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/mfa/enable") {
    const res = await fetch(`${getIamBase()}/mfa/enable`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/mfa/disable") {
    const res = await fetch(`${getIamBase()}/mfa/disable`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    return proxyIamResponse(res);
  }

  if (pathname === "/mfa/regenerate-recovery") {
    const res = await fetch(`${getIamBase()}/mfa/regenerate-recovery`, {
      method: "POST",
      headers: forwardedHeaders(req, true),
      body: JSON.stringify(body),
    });
    return proxyIamResponse(res);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
