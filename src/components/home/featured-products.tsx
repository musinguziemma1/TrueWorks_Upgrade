"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export default function FeaturedProducts() {
  const featured = getFeaturedProducts(6);

  return (
    <section className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              Featured
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
              Templates &amp; Systems That Deliver
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
              Professional-grade Excel solutions, ready to download and deploy in
              your organization today.
            </p>
          </div>
          <Link
            href="/store"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-accent-dark"
          >
            View all templates
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((product, i) => (
            <motion.div
              key={product.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
