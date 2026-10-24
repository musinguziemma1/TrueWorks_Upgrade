"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
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
  if (!convexClient) {
    return (
      <section className="relative overflow-hidden bg-surface py-12 lg:py-16">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
            <p className="font-heading text-base font-semibold text-primary">
              Templates unavailable right now
            </p>
            <p className="mt-1 text-sm text-muted">
              Please check your connection and visit{" "}
              <Link href="/store" className="font-semibold text-primary underline">
                the store
              </Link>{" "}
              to browse all templates.
            </p>
          </div>
        </div>
      </section>
    );
  }
  return <FeaturedProductsInner />;
}

function FeaturedProductsInner() {
  const products = useQuery(api.products.list, {
    status: "published",
    featured: true,
    productType: "template",
    limit: 100,
  });
  const rawFeatured = products?.items;
  const allFeatured = useMemo(() => (rawFeatured ?? []) as StoreProduct[], [rawFeatured]);
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(allFeatured.map((product) => product.category).filter(Boolean)))],
    [allFeatured]
  );
  const featured = allFeatured
    .filter((product) => activeCategory === "All" || product.category === activeCategory)
    .slice(0, 12);

  if (products === undefined) {
    return (
      <section className="relative overflow-hidden bg-surface py-12 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-surface py-12 lg:py-16">
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
              Templates &amp; systems that deliver
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

        <div className="mb-8 overflow-x-auto pb-1" role="tablist" aria-label="Featured template categories">
          <div className="flex min-w-max items-center gap-2 rounded-2xl border border-border/70 bg-white/75 p-2 shadow-sm backdrop-blur">
            {categories.map((category) => {
              const count = category === "All"
                ? allFeatured.length
                : allFeatured.filter((product) => product.category === category).length;
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(category)}
                  className={active
                    ? "rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15"
                    : "rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-primary"}
                >
                  {category}
                  <span className={active ? "ml-2 text-xs text-white/60" : "ml-2 text-xs text-muted-foreground"}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid - six columns by two rows on wide screens */}
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" style={{ gridAutoRows: "1fr" }}>
            {featured.map((product, i) => (
              <motion.div
                key={product._id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="h-full"
              >
                <ProductCard product={product} className="h-full" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
            <p className="font-heading text-base font-semibold text-primary">
              No templates in this category yet
            </p>
            <p className="mt-1 text-sm text-muted">
              Try another category or browse all featured templates.{" "}
              <Link href="/store" className="font-semibold text-primary underline">
                Browse the store
              </Link>
              .
            </p>
          </div>
        )}

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
