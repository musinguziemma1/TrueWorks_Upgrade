"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles, Star } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { ProductCard, type StoreProduct } from "@/components/product/product-card";

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export default function FeaturedProducts() {
  if (!convexClient) return null;
  return <FeaturedProductsInner />;
}

function FeaturedProductsInner() {
  const products = useQuery(api.products.list, { status: "published", featured: true });
  const featured = (products?.items ?? []).slice(0, 6) as StoreProduct[];

  if (products === undefined) {
    return (
      <section className="relative overflow-hidden bg-surface py-20 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-surface py-20 lg:py-24">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),transparent)]" />
      <div className="absolute -right-32 top-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1">
              <Sparkles className="h-3 w-3 text-accent-dark" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-dark">
                Featured
              </span>
            </div>
            <h2 className="font-heading text-3xl font-semibold text-primary md:text-4xl">
              Templates &amp; Systems That Deliver
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
              Professional-grade Excel solutions, ready to download and deploy in
              your organization today.
            </p>
          </div>
          <Link
            href="/store"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/10 bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent-dark hover:shadow-md"
          >
            View all templates
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Product Grid - max 2 rows (6 cards on 3-col, 4 on 2-col) */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product, i) => (
            <motion.div
              key={product._id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="flex"
            >
              <div className="flex w-full">
                <ProductCard product={product} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-12 h-px w-48 bg-gradient-to-r from-transparent via-accent/30 to-transparent"
        />
      </div>
    </section>
  );
}
