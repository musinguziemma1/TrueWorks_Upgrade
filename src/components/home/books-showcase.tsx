"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { ProductCard, type StoreProduct } from "@/components/product/product-card";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export default function BooksShowcase() {
  if (!convexClient) return null;
  return <BooksShowcaseInner />;
}

function BooksShowcaseInner() {
  const products = useQuery(api.products.list, {
    status: "published",
    productType: "book",
    limit: 3,
  });
  const books = (products?.items ?? []).slice(0, 3) as StoreProduct[];

  if (products === undefined) {
    return (
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-12 lg:px-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (books.length === 0) return null;

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            TrueWorks Books
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Practical ideas for better work
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Digital guides and playbooks to help founders, managers and teams make clearer decisions.
          </p>
        </motion.div>

        <div className="relative">
          <div
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block"
            aria-hidden
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {books.map((book, i) => (
              <motion.div
                key={book._id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="h-full"
              >
                <ProductCard product={book} layout="grid" className="h-full" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/store?type=book"
            className="group inline-flex items-center gap-2 rounded-xl border border-primary/10 bg-surface px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent-dark"
          >
            <BookOpen className="h-4 w-4" />
            Browse all books
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
