"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCart } from "@/components/layout/cart-context";
import { useWishlist } from "@/components/layout/wishlist-context";
import { useAuth } from "@/lib/auth/provider";

const GUEST_SESSION_KEY = "tw-guest-session";

/**
 * Stable per-session guest address for anonymous abandoned-cart tracking.
 * Anonymous carts can't be emailed (`*.local`), but keeping one address per
 * session means a browsing visitor produces a single cart row that gets
 * updated, instead of one row per cart edit.
 */
function getGuestSessionEmail() {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return `guest-${id}@trueworks.local`;
  } catch {
    // sessionStorage can throw when storage is blocked — fall back to a
    // per-page-load address so tracking still works.
    return `guest-page-${Date.now()}@trueworks.local`;
  }
}

export function CartSync() {
  const { isAuthenticated, loading } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const pushedLocal = useRef(false);
  const pulledRemote = useRef(false);
  const lastTrackedRef = useRef<string>("");

  const serverCart = useQuery(api.carts.getMine, loading || !isAuthenticated ? "skip" : {});
  const saveMine = useMutation(api.carts.saveMine);
  const trackAbandoned = useMutation(api.abandonedCarts.track);
  const currentUser = useQuery(api.users.current, loading || !isAuthenticated ? "skip" : {});

  // Derived readiness flag — replaces the previous `synced` state so that
  // effects never need to call setState synchronously.
  const ready = isAuthenticated && !loading && serverCart !== undefined && currentUser !== undefined;

  useEffect(() => {
    // One-time pull of the server cart (or push of the local one) per session.
    if (!ready || pulledRemote.current) return;
    pulledRemote.current = true;

    if (serverCart && (serverCart.items.length > 0 || serverCart.wishlist.length > 0)) {
      cart.replaceItems(serverCart.items);
      wishlist.replaceItems(serverCart.wishlist);
    } else if (!pushedLocal.current) {
      pushedLocal.current = true;
      saveMine({ items: cart.items, wishlist: wishlist.items }).catch(() => {});
    }
  }, [ready, serverCart, currentUser, cart, wishlist, saveMine]);

  useEffect(() => {
    // Debounced push of subsequent local edits while signed in.
    if (!ready || !pulledRemote.current) return;
    const t = setTimeout(() => {
      saveMine({ items: cart.items, wishlist: wishlist.items }).catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [cart.items, wishlist.items, ready, saveMine]);

  useEffect(() => {
    // Reset session refs on sign-out so the next sign-in re-syncs.
    if (!loading && !isAuthenticated) {
      pulledRemote.current = false;
      pushedLocal.current = false;
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (loading || isAuthenticated || cart.items.length === 0) return;

    const fingerprint = cart.items.map((i) => `${i.id}:${i.tier ?? ""}:${i.quantity}`).join("|");
    if (fingerprint === lastTrackedRef.current) return;

    const t = setTimeout(() => {
      lastTrackedRef.current = fingerprint;
      // One stable guest address per browser session. This used to be
      // `guest-${Date.now()}` — unique on every edit — so every anonymous cart
      // change inserted a *brand-new* abandoned-cart row that could never be
      // emailed or recovered. With a stable address the backend patches the
      // one guest cart for the session instead of piling up rows.
      trackAbandoned({
        email: getGuestSessionEmail(),
        items: cart.items,
      }).catch(() => {});
    }, 5000);

    return () => clearTimeout(t);
  }, [cart.items, loading, isAuthenticated, trackAbandoned]);

  return null;
}
