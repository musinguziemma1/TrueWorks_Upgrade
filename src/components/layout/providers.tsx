"use client";

import { useState, type ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { getConvexClient } from "@/lib/convex";
import { CartProvider } from "@/components/layout/cart-context";
import { WishlistProvider } from "@/components/layout/wishlist-context";
import { SettingsProvider } from "@/lib/settings-context";
import { ThemeApply } from "@/components/layout/theme-apply";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    try {
      return getConvexClient();
    } catch {
      return null;
    }
  });

  const wrapped = (
    <CartProvider>
      <WishlistProvider>
        <SettingsProvider>
          <ThemeApply />
          {children}
          <Toaster />
        </SettingsProvider>
      </WishlistProvider>
    </CartProvider>
  );

  if (!client) return wrapped;

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {wrapped}
    </ConvexProviderWithClerk>
  );
}
