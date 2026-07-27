"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { convexClient } from "@/lib/convex";
import { CartProvider } from "@/components/layout/cart-context";
import { WishlistProvider } from "@/components/layout/wishlist-context";
import { SettingsProvider } from "@/lib/settings-context";
import { ThemeApply } from "@/components/layout/theme-apply";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const wrapped = (
    <CartProvider>
      <WishlistProvider>
        {convexClient ? (
          <SettingsProvider>
            <ThemeApply />
            {children}
            <Toaster />
          </SettingsProvider>
        ) : (
          <>
            <ThemeApply />
            {children}
            <Toaster />
          </>
        )}
      </WishlistProvider>
    </CartProvider>
  );

  if (!convexClient) return wrapped;

  return (
    <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
      {wrapped}
    </ConvexProviderWithClerk>
  );
}
