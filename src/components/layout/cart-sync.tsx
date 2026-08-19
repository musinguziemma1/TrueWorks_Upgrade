"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCart } from "@/components/layout/cart-context";
import { useWishlist } from "@/components/layout/wishlist-context";
import { useAuth } from "@/lib/auth/provider";

export function CartSync() {
  const { isAuthenticated, loading } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const [synced, setSynced] = useState(false);
  const pushedLocal = useRef(false);
  const lastTrackedRef = useRef<string>("");

  const serverCart = useQuery(api.carts.getMine, loading || !isAuthenticated ? "skip" : {});
  const saveMine = useMutation(api.carts.saveMine);
  const trackAbandoned = useMutation(api.abandonedCarts.track);
  const currentUser = useQuery(api.users.current, loading || !isAuthenticated ? "skip" : {});

  useEffect(() => {
    if (!isAuthenticated || synced || serverCart === undefined || currentUser === undefined) return;

    if (serverCart && (serverCart.items.length > 0 || serverCart.wishlist.length > 0)) {
      cart.replaceItems(serverCart.items);
      wishlist.replaceItems(serverCart.wishlist);
    } else if (!pushedLocal.current) {
      pushedLocal.current = true;
      saveMine({ items: cart.items, wishlist: wishlist.items }).catch(() => {});
    }
    setSynced(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, serverCart, currentUser, synced]);

  useEffect(() => {
    if (!synced || !isAuthenticated || !currentUser) return;
    const t = setTimeout(() => {
      saveMine({ items: cart.items, wishlist: wishlist.items }).catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items, wishlist.items, synced, isAuthenticated, currentUser]);

  useEffect(() => {
    if (!loading && !isAuthenticated && synced) {
      setSynced(false);
      pushedLocal.current = false;
    }
  }, [loading, isAuthenticated, synced]);

  useEffect(() => {
    if (loading || isAuthenticated || cart.items.length === 0) return;

    const fingerprint = cart.items.map((i) => `${i.id}:${i.quantity}`).join("|");
    if (fingerprint === lastTrackedRef.current) return;

    const t = setTimeout(() => {
      lastTrackedRef.current = fingerprint;
      const sessionEmail = `guest-${Date.now()}@trueworks.local`;
      trackAbandoned({
        email: sessionEmail,
        items: cart.items,
      }).catch(() => {});
    }, 5000);

    return () => clearTimeout(t);
  }, [cart.items, loading, isAuthenticated, trackAbandoned]);

  return null;
}
