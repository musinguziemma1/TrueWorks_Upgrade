"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  ChevronRight,
  PlayCircle,
  Headphones,
  ArrowRight,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCart, type CartItem } from "@/components/layout/cart-context";
import { Button } from "@/components/ui/button";

const steps = ["Cart", "Checkout", "Confirmation"];

const nextSteps = [
  {
    icon: Download,
    title: "Download your templates",
    desc: "Access your files instantly from the email we just sent you.",
  },
  {
    icon: PlayCircle,
    title: "Watch the quick-start video",
    desc: "Learn how to customize and get the most from your templates.",
  },
  {
    icon: Headphones,
    title: "We're here if you need us",
    desc: "Our support team answers within one business day.",
  },
];

export default function OrderConfirmationContent() {
  const { items, totalPrice, clearCart } = useCart();
  const [snapshot, setSnapshot] = useState<CartItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [orderNumber, setOrderNumber] = useState("");
  const captured = useRef(false);

  // Snapshot the cart once, then clear it (purchase complete)
  useEffect(() => {
    if (captured.current) return;
    captured.current = true;
    setSnapshot(items);
    setTotal(totalPrice);
    setOrderNumber(`TW-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
    if (items.length > 0) clearCart();
  }, [items, totalPrice, clearCart]);

  // Wait for the cart snapshot before deciding what to render
  if (snapshot === null) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-surface">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent" aria-label="Loading" />
      </div>
    );
  }

  const hasOrder = snapshot.length > 0;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        {/* Steps */}
        <ol className="mb-10 flex flex-wrap items-center justify-center gap-2 text-sm">
          {steps.map((step, idx) => (
            <li key={step} className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 font-medium text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                {step}
              </span>
              {idx < steps.length - 1 && <ChevronRight className="h-4 w-4 text-border" />}
            </li>
          ))}
        </ol>

        {hasOrder ? (
          <>
            {/* Success card */}
            <div className="rounded-2xl border border-border/70 bg-white p-8 text-center shadow-card sm:p-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
                >
                  <CheckCircle2 className="h-11 w-11 text-success" />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h1 className="mt-6 font-heading text-3xl font-semibold text-primary md:text-4xl">
                  Thank You for Your Order
                </h1>
                <p className="mt-3 text-muted">
                  Your payment was successful and your templates are ready.
                </p>

                <div className="mt-6 inline-flex items-center gap-2.5 rounded-lg bg-surface px-4 py-2.5">
                  <span className="text-sm text-muted">Order number</span>
                  <span className="font-heading text-sm font-bold tracking-wider text-primary">
                    {orderNumber || "TW-········"}
                  </span>
                </div>

                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
                  <Mail className="h-4 w-4 text-secondary" />
                  A confirmation with download links is on its way to your inbox.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="gradient-gold px-7 font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Your Templates
                  </Button>
                  <Link href="/store">
                    <Button variant="outline" size="lg" className="border-primary/20 px-7 font-semibold text-primary hover:bg-primary hover:text-white">
                      Back to Store
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Order details */}
            {snapshot.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8"
              >
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Order Details
                </h2>
                <div className="mt-4 divide-y divide-border">
                  {snapshot.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br",
                            item.image || "from-primary to-primary-light"
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
                  <span className="font-heading text-base font-semibold text-primary">Total Paid</span>
                  <span className="font-heading text-xl font-bold text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* What's next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="mt-8 rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8"
            >
              <h2 className="font-heading text-lg font-semibold text-primary">
                What Happens Next
              </h2>
              <div className="mt-5 space-y-5">
                {nextSteps.map((item, i) => (
                  <div key={item.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
                      <item.icon className="h-5 w-5 text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        <span className="mr-2 font-heading font-bold text-accent-dark">{i + 1}.</span>
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        ) : (
          /* No order snapshot (direct visit) */
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface">
              <ShoppingBag className="h-7 w-7 text-muted/60" />
            </span>
            <h1 className="mt-6 font-heading text-2xl font-semibold text-primary">
              No Recent Order Found
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              It looks like you haven&apos;t placed an order yet. Explore the
              store to find the right templates for your organization.
            </p>
            <Link href="/store" className="mt-8 inline-block">
              <Button size="lg" className="gradient-gold px-7 font-semibold text-primary-dark hover:brightness-105">
                Browse the Store
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
