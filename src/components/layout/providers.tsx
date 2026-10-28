"use client";

import { ConvexProviderWithAuth } from "convex/react";
import { convexClient } from "@/lib/convex";
import { AuthProvider, useAuth as useAppAuth } from "@/lib/auth/provider";
import { CartProvider } from "@/components/layout/cart-context";
import { WishlistProvider } from "@/components/layout/wishlist-context";
import { CartSync } from "@/components/layout/cart-sync";
import { AnalyticsTracker } from "@/components/layout/analytics-tracker";
import { SettingsProvider } from "@/lib/settings-context";
import { ThemeApply } from "@/components/layout/theme-apply";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const wrapped = (
    <CartProvider>
      <WishlistProvider>
        <SettingsProvider>
          <CartSync />
          <AnalyticsTracker />
          <ThemeApply />
          {children}
          <Toaster />
        </SettingsProvider>
      </WishlistProvider>
    </CartProvider>
  );

  return (
    <AuthProvider>
      {convexClient ? (
        <ConvexProviderWithAuth client={convexClient} useAuth={useConvexAuth}>
          {wrapped}
        </ConvexProviderWithAuth>
      ) : (
        wrapped
      )}
    </AuthProvider>
  );
}

function useConvexAuth() {
  const { loading, isAuthenticated, getToken } = useAppAuth();
  return {
    isLoading: loading,
    isAuthenticated,
    fetchAccessToken: async () => getToken(),
  };
}
