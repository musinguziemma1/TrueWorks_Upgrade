"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

interface User {
  _id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ ok: boolean; error?: string; requiresVerification?: boolean; mfaRequired?: boolean }>;
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;
  const isAdmin = user ? ["admin", "owner", "superadmin"].includes(user.role) : false;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      await refresh();
      return { ok: true };
    }
    return { ok: false, error: data.error, requiresVerification: data.requiresVerification, mfaRequired: data.mfaRequired };
  }, [refresh]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
      credentials: "include",
    });
    const data = await res.json();
    return { ok: res.ok, error: data.error };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
    }
  }, []);

  const getToken = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/token", { method: "POST", credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data.token === "string" ? data.token : null;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isAdmin, login, register, logout, refresh, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useUser() {
  const { user, isAuthenticated, loading } = useAuth();
  return { user, isSignedIn: isAuthenticated, isLoaded: !loading };
}
