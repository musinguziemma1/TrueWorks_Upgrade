"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Download,
  Sparkles,
  Package,
  RefreshCw,
  Lock,
  Zap,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { useCart, cartItemKey } from "@/components/layout/cart-context";
import { useFormatPrice } from "@/lib/use-format-price";
import { ProductCard, type StoreProduct } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

const trustBadges = [
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: Download, label: "Instant download" },
  { icon: RefreshCw, label: "30-day guarantee" },
  { icon: Lock, label: "SSL encrypted" },
];

export default function CartContent() {
  const formatPrice = useFormatPrice();
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart();

  // Featured pick for the "You may also like" strip. Pulls up to 4 published
  // featured products so the strip is never empty on a healthy catalog.
  const featured = useQuery(api.products.list, {
    status: "published",
    featured: true,
    limit: 4,
  });
  const recommended = ((featured?.items ?? []) as StoreProduct[]).filter(
    (p) => !items.find((it) => it.id === p._id),
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071A33] via-[#071A33] to-[#071A33] py-12 lg:py-16">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent/[0.10] blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[24rem] w-[24rem] rounded-full bg-blue-500/[0.10] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.05] blur-3xl" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "400px 400px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
                Your selection
              </p>
              <h1 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">
                Shopping Cart
              </h1>
              <p className="mt-2 text-sm text-white/70">
                {totalItems > 0
                  ? `${totalItems} ${totalItems === 1 ? "template" : "templates"} ready for instant download`
                  : "Pick the templates you want to take home"}
              </p>
            </div>
            {items.length > 0 && (
              <Link
                href="/store"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Continue shopping
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        {items.length === 0 ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-white px-6 py-20 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
                  <ShoppingBag className="h-9 w-9" />
                </span>
                <h2 className="mt-6 font-heading text-2xl font-semibold text-primary">
                  Your cart is empty
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                  Browse the store to find templates and systems built for your
                  organization. Every purchase is instantly downloadable.
                </p>
                <Link href="/store" className="mt-8">
                  <Button
                    size="lg"
                    className="gradient-gold px-7 font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
                  >
                    Browse the Store
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <div className="mt-10 grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
                  {trustBadges.map((b) => (
                    <div
                      key={b.label}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-3"
                    >
                      <b.icon className="h-4 w-4 text-accent-dark" />
                      <span className="text-[11px] font-medium text-muted">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <aside className="lg:col-span-1">
              <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-card">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                  Why shop with us
                </h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {[
                    "Pay in UGX, USD, KES, NGN, ZAR & more",
                    "Receive download links by email instantly",
                    "All templates come with a 30-day guarantee",
                    "Loyalty discounts on bundle purchases",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-muted">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-accent-dark"
                >
                  Have a question? Contact us
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              {/* Items */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold text-primary">
                    Your items
                    <span className="ml-2 text-sm font-normal text-muted">
                      ({totalItems})
                    </span>
                  </h2>
                  {items.length > 1 && (
                    <button
                      onClick={() => items.forEach((it) => removeItem(cartItemKey(it)))}
                      className="text-xs font-medium text-muted transition-colors hover:text-error"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={cartItemKey(item)}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 80, height: 0, marginBottom: 0, overflow: "hidden" }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="group flex gap-4 rounded-2xl border border-border/70 bg-white p-4 shadow-card transition-all hover:border-accent/30 sm:gap-5 sm:p-5"
                      >
                        <Link
                          href={`/store/${item.slug}`}
                          className={cn(
                            "relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28",
                            !item.image && "bg-gradient-to-br from-primary via-primary-light to-secondary"
                          )}
                          aria-hidden
                          tabIndex={-1}
                        >
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="(max-width: 640px) 96px, 112px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-end gap-1 p-3">
                              {[55, 80, 65, 95].map((h, i) => (
                                <span
                                  key={i}
                                  className="w-2 rounded-sm bg-white/30"
                                  style={{ height: `${(h / 100) * 32 + 6}px` }}
                                />
                              ))}
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link
                                href={`/store/${item.slug}`}
                                className="font-heading text-base font-semibold leading-snug text-primary transition-colors hover:text-accent-dark"
                              >
                                {item.name}
                                {item.tier && (
                                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-dark">
                                    {item.tier}
                                  </span>
                                )}
                              </Link>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                                <Download className="h-3 w-3" />
                                Digital download · {formatPrice(item.price)} each
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(cartItemKey(item))}
                              className="rounded-md p-2 text-muted transition-colors hover:bg-error/5 hover:text-error"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center rounded-lg border border-border">
                              <button
                                onClick={() => updateQuantity(cartItemKey(item), item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-2.5 text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-30"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-10 text-center text-sm font-semibold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(cartItemKey(item), item.quantity + 1)}
                                className="p-2.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="font-heading text-lg font-bold text-primary">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-5">
                  <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-card">
                    <h2 className="font-heading text-lg font-semibold text-primary">
                      Order Summary
                    </h2>

                    <dl className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between text-muted">
                        <dt>
                          Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
                        </dt>
                        <dd className="font-medium text-foreground">{formatPrice(totalPrice)}</dd>
                      </div>
                      <div className="flex justify-between text-muted">
                        <dt>Delivery</dt>
                        <dd className="flex items-center gap-1.5 font-medium text-success">
                          <Download className="h-3.5 w-3.5" />
                          Instant
                        </dd>
                      </div>
                      {totalPrice >= 100 && (
                        <div className="flex justify-between text-muted">
                          <dt className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-accent-dark" />
                            Bulk discount
                          </dt>
                          <dd className="font-medium text-success">Auto-applied</dd>
                        </div>
                      )}
                      <div className="border-t border-border pt-4">
                        <div className="flex items-baseline justify-between">
                          <dt className="font-heading text-base font-semibold text-primary">Total</dt>
                          <dd className="font-heading text-2xl font-bold text-primary">
                            {formatPrice(totalPrice)}
                          </dd>
                        </div>
                      </div>
                    </dl>

                    <Link href="/checkout" className="mt-6 block">
                      <Button
                        size="lg"
                        className="w-full gradient-gold text-sm font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>

                    <Link
                      href="/store"
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-primary"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Continue shopping
                    </Link>
                  </div>

                  {/* Trust strip */}
                  <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-card">
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-primary">
                      Why buy from us
                    </h3>
                    <ul className="mt-3 space-y-2.5">
                      {trustBadges.map((b) => (
                        <li
                          key={b.label}
                          className="flex items-center gap-2.5 text-xs text-muted"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
                            <b.icon className="h-3.5 w-3.5" />
                          </span>
                          {b.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Need help */}
                  <div className="gradient-brand relative overflow-hidden rounded-2xl p-6 shadow-card">
                    <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                    <div className="relative">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-accent-light">
                        <Package className="h-4 w-4" />
                      </span>
                      <h3 className="mt-4 font-heading text-base font-semibold text-white">
                        Need a custom build?
                      </h3>
                      <p className="mt-1.5 text-sm text-white/85">
                        We design bespoke business operating systems for
                        organizations of every size.
                      </p>
                      <Link
                        href="/contact"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light transition-transform hover:translate-x-0.5"
                      >
                        Talk to our team
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── You may also like ──────────────────────────────── */}
            {recommended.length > 0 && (
              <div className="mt-16 lg:mt-20">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                      You may also like
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold text-primary md:text-3xl">
                      Featured templates
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                      Hand-picked picks from our most popular templates.
                    </p>
                  </div>
                  <Link
                    href="/store"
                    className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-accent-dark sm:inline-flex"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {recommended.slice(0, 4).map((rp) => (
                    <ProductCard key={rp._id} product={rp} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
