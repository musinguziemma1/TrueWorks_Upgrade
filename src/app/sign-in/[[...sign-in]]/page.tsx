"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/auth/provider";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirect = searchParams.get("redirect") || "/account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password, rememberMe);
    if (result.ok) {
      router.push(redirect);
    } else if (result.mfaRequired) {
      setMfaRequired(true);
    } else if (result.requiresVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      setError(result.error || "Invalid credentials");
    }
    setLoading(false);
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/mfa/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfaSessionToken: mfaToken, code: (e.target as HTMLFormElement).code.value }),
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      router.push(redirect);
    } else {
      setError(data.error || "Invalid MFA code");
    }
    setLoading(false);
  };

  if (mfaRequired) {
    return (
      <AuthLayout mode="signin">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary-dark">Two-Factor Authentication</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter the code from your authenticator app.</p>
          </div>
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="mb-1.5 block text-sm font-medium">Verification code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="123456"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary text-white font-semibold transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout mode="signin">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-dark">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your TrueWorks account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-primary text-white font-semibold transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
