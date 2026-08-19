"use client";

import { ConvexProvider } from "convex/react";
import { convexClient } from "@/lib/convex";
import { AuthProvider } from "@/lib/auth/provider";
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

  if (!convexClient) return wrapped;

  return (
    <ConvexProvider client={convexClient}>
      <AuthProvider>
        {wrapped}
      </AuthProvider>
    </ConvexProvider>
  );
}
