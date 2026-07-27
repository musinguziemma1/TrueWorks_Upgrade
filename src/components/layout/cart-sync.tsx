"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCart } from "@/components/layout/cart-context";
import { useWishlist } from "@/components/layout/wishlist-context";

/**
 * Syncs the local cart + wishlist to the server for signed-in users.
 * - On sign-in: server data replaces local (server is cross-device truth);
 *   if the server is empty, the local cart is pushed up instead.
 * - On change: debounce-saves (1s) to the server.
 * Renders nothing.
 */
export function CartSync() {
  const { isLoaded, isSignedIn } = useUser();
  const cart = useCart();
  const wishlist = useWishlist();
  const [synced, setSynced] = useState(false);
  const pushedLocal = useRef(false);

  const serverCart = useQuery(api.carts.getMine, isLoaded && isSignedIn ? {} : "skip");
  const saveMine = useMutation(api.carts.saveMine);

  // Initial merge on sign-in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || synced || serverCart === undefined) return;

    if (serverCart && (serverCart.items.length > 0 || serverCart.wishlist.length > 0)) {
      // Server has data — it wins (cross-device truth)
      cart.replaceItems(serverCart.items);
      wishlist.replaceItems(serverCart.wishlist);
    } else if (!pushedLocal.current) {
      // Server empty — push local up
      pushedLocal.current = true;
      saveMine({ items: cart.items, wishlist: wishlist.items }).catch(() => {});
    }
    setSynced(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, serverCart, synced]);

  // Debounced save on changes
  useEffect(() => {
    if (!synced || !isSignedIn) return;
    const t = setTimeout(() => {
      saveMine({ items: cart.items, wishlist: wishlist.items }).catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items, wishlist.items, synced, isSignedIn]);

  // Reset sync state on sign-out so a different account can re-sync
  useEffect(() => {
    if (isLoaded && !isSignedIn && synced) {
      setSynced(false);
      pushedLocal.current = false;
    }
  }, [isLoaded, isSignedIn, synced]);

  return null;
}
