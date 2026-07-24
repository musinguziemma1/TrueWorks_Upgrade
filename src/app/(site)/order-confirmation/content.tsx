"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "";
  const total = Number(searchParams.get("total")) || 0;

  const hasOrder = orderNumber && total > 0;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
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
                  Your order has been received and is being processed.
                </p>

                <div className="mt-6 inline-flex items-center gap-2.5 rounded-lg bg-surface px-4 py-2.5">
                  <span className="text-sm text-muted">Order number</span>
                  <span className="font-heading text-sm font-bold tracking-wider text-primary">
                    {orderNumber}
                  </span>
                </div>

                <div className="mt-4 inline-flex items-center gap-2.5 rounded-lg bg-surface px-4 py-2.5 ml-2">
                  <span className="text-sm text-muted">Total</span>
                  <span className="font-heading text-sm font-bold tracking-wider text-primary">
                    {formatPrice(total)}
                  </span>
                </div>

                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
                  <Mail className="h-4 w-4 text-secondary" />
                  A confirmation with download links is on its way to your inbox.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/account/downloads">
                    <Button
                      size="lg"
                      className="gradient-gold px-7 font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      View Your Downloads
                    </Button>
                  </Link>
                  <Link href="/store">
                    <Button variant="outline" size="lg" className="border-primary/20 px-7 font-semibold text-primary hover:bg-primary hover:text-white">
                      Back to Store
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>

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
