"use client";

import { type ReactNode, useEffect, useState } from "react";
import { ConvexProvider } from "@/lib/convex";
import { getConvexClient } from "@/lib/convex";
import { CartProvider } from "@/components/layout/cart-context";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ReturnType<typeof getConvexClient> | null>(null);

  useEffect(() => {
    try {
      // Convex client can only be created in the browser, so a one-time
      // state sync on mount is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClient(getConvexClient());
    } catch {
      // Convex not configured
    }
  }, []);

  const wrapped = (
    <CartProvider>
      {children}
      <Toaster />
    </CartProvider>
  );

  if (!client) return wrapped;

  return (
    <ConvexProvider client={client}>
      {wrapped}
    </ConvexProvider>
  );
}
