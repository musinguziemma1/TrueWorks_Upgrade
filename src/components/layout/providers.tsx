"use client";

import { useState, type ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { getConvexClient } from "@/lib/convex";
import { CartProvider } from "@/components/layout/cart-context";
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
      {children}
      <Toaster />
    </CartProvider>
  );

  if (!client) return wrapped;

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {wrapped}
    </ConvexProviderWithClerk>
  );
}
