"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, cartItemKey } from "@/components/layout/cart-context";
import { useFormatPrice } from "@/lib/use-format-price";
import { Button } from "@/components/ui/button";

export default function CartContent() {
  const formatPrice = useFormatPrice();
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart();

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Your Selection
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Shopping Cart
          </h1>
          <p className="mt-2 text-sm text-muted">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <>
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-white py-20 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
                <ShoppingBag className="h-9 w-9 text-muted/60" />
              </span>
              <h2 className="mt-6 font-heading text-2xl font-semibold text-primary">
                Your cart is empty
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Browse the store to find templates and systems for your
                organization.
              </p>
              <Link href="/store" className="mt-8">
                <Button
                  size="lg"
                  className="gradient-gold px-7 font-semibold text-primary-dark hover:brightness-105"
                >
                  Browse the Store
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2">
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
                      className="flex gap-5 rounded-xl border border-border/70 bg-white p-5 shadow-card sm:gap-6 sm:p-6"
                    >
                      <Link
                        href={`/store/${item.slug}`}
                        className={cn(
                          "relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br sm:block",
                          item.image || "from-primary to-primary-light"
                        )}
                        aria-hidden
                        tabIndex={-1}
                      >
                        <div className="absolute inset-x-4 bottom-4 flex items-end gap-1">
                          {[55, 80, 65, 95].map((h, i) => (
                            <span key={i} className="w-2 rounded-sm bg-white/30" style={{ height: `${(h / 100) * 32 + 6}px` }} />
                          ))}
                        </div>
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/store/${item.slug}`}
                              className="font-heading text-base font-semibold text-primary transition-colors hover:text-accent-dark"
                            >
                              {item.name}
                              {item.tier && (
                                <span className="ml-2 text-xs font-medium text-accent-dark">
                                  ({item.tier})
                                </span>
                              )}
                            </Link>
                            <p className="mt-1 text-xs text-muted">
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

              <Link
                href="/store"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Continue shopping
              </Link>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-xl border border-border/70 bg-white p-6 shadow-card">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Order Summary
                </h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between text-muted">
                    <dt>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</dt>
                    <dd className="font-medium text-foreground">{formatPrice(totalPrice)}</dd>
                  </div>
                  <div className="flex justify-between text-muted">
                    <dt>Delivery</dt>
                    <dd className="flex items-center gap-1.5 font-medium text-success">
                      <Download className="h-3.5 w-3.5" />
                      Instant
                    </dd>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex items-baseline justify-between">
                      <dt className="font-heading text-base font-semibold text-primary">Total</dt>
                      <dd className="font-heading text-xl font-bold text-primary">
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
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <div className="mt-6 space-y-2.5 border-t border-border pt-5">
                  <p className="flex items-center gap-2.5 text-xs text-muted">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    Secure, encrypted checkout
                  </p>
                  <p className="flex items-center gap-2.5 text-xs text-muted">
                    <CreditCard className="h-4 w-4 text-secondary" />
                    MTN MoMo, Airtel Money, Visa &amp; Mastercard
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
