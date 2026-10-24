"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, ChevronRight, Loader2, ShoppingCart } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { useFormatPrice } from "@/lib/use-format-price";
import type { StoreProduct } from "@/components/product/product-card";

const ROTATION_MS = 15_000;

export default function BooksShowcase() {
  if (!convexClient) return null;
  return <BooksShowcaseInner />;
}

function BooksShowcaseInner() {
  const formatPrice = useFormatPrice();
  const products = useQuery(api.products.list, {
    status: "published",
    productType: "book",
    limit: 8,
  });
  const books = (products?.items ?? []) as StoreProduct[];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (books.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % books.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [books.length]);

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

  const selectedIndex = activeIndex % books.length;
  const activeBook = books[selectedIndex] ?? books[0];
  const activePrice = activeBook.salePrice ?? activeBook.price;

  return (
    <section className="overflow-hidden bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">TrueWorks Books</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">Practical ideas for better work</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">Digital guides and playbooks to help founders, managers and teams make clearer decisions.</p>
        </motion.div>

        <div className="grid overflow-hidden rounded-3xl border border-primary/10 bg-[#f5f7fb] shadow-elevated lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-[540px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#071c38] via-[#0b315c] to-[#235987] p-7 text-white sm:p-10 lg:min-h-[590px]">
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/15 blur-3xl" aria-hidden />
            <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-light backdrop-blur"><BookOpen className="h-3.5 w-3.5" />Now reading</span>
              <span className="text-xs text-white/55">{selectedIndex + 1} / {books.length}</span>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center py-8">
              <AnimatePresence mode="wait">
                <motion.div key={activeBook._id} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.96 }} transition={{ duration: 0.45 }} className="relative h-[390px] w-[265px] overflow-hidden rounded-md bg-white/10 shadow-[0_24px_45px_rgba(0,0,0,0.38)] ring-1 ring-white/20 sm:h-[455px] sm:w-[310px]">
                  {activeBook.thumbnail ? <Image src={activeBook.thumbnail} alt={activeBook.name} fill priority sizes="(max-width: 640px) 265px, 310px" className="object-contain" /> : <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">{activeBook.name}</div>}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10">
              <AnimatePresence mode="wait">
                <motion.div key={`${activeBook._id}-details`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-light">Digital book</p>
                  <h3 className="mt-2 max-w-xl font-heading text-2xl font-semibold leading-tight text-white sm:text-3xl">{activeBook.name}</h3>
                  {activeBook.bookAuthor && <p className="mt-2 text-sm text-white/70">by {activeBook.bookAuthor}</p>}
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <span className="font-heading text-2xl font-bold">{formatPrice(activePrice)}</span>
                    {activeBook.salePrice && <span className="text-sm text-white/50 line-through">{formatPrice(activeBook.price)}</span>}
                    <Link href={`/store/${activeBook.slug}`} className="group inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary-dark transition-colors hover:bg-accent-light">Explore book<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="mt-7 h-1 overflow-hidden rounded-full bg-white/15"><motion.div key={activeBook._id} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: ROTATION_MS / 1000, ease: "linear" }} className="h-full rounded-full bg-accent" /></div>
              <p className="mt-2 text-[11px] text-white/50">Next book in 15 seconds</p>
            </div>
          </div>

          <div className="flex flex-col bg-white p-5 sm:p-7 lg:p-8">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-border/70 pb-4">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-dark">The collection</p><h3 className="mt-1 font-heading text-xl font-semibold text-primary">Choose your next read</h3></div>
              <Link href="/store?type=book" className="hidden items-center gap-1 text-xs font-semibold text-primary hover:text-accent-dark sm:inline-flex">View all <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {books.map((book, index) => {
                const isActive = index === selectedIndex;
                return (
                  <button key={book._id} type="button" onClick={() => setActiveIndex(index)} className={`group flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all ${isActive ? "bg-primary/[0.06] ring-1 ring-primary/15" : "hover:bg-surface"}`} aria-pressed={isActive}>
                    <span className="relative h-24 w-[68px] shrink-0 overflow-hidden rounded-md bg-[#f2eee5] shadow-sm ring-1 ring-black/5">
                      {book.thumbnail ? <Image src={book.thumbnail} alt="" fill sizes="68px" className="object-contain" /> : <span className="flex h-full items-center justify-center px-1 text-center text-[9px] text-muted-foreground">Book</span>}
                    </span>
                    <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className={`line-clamp-2 text-sm font-semibold leading-snug ${isActive ? "text-primary" : "text-primary/80"}`}>{book.name}</span>{isActive && <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Currently selected" />}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{book.bookAuthor ? `by ${book.bookAuthor}` : "TrueWorks Books"}</span><span className="mt-2 flex items-center gap-2 text-xs"><span className="font-semibold text-primary">{formatPrice(book.salePrice ?? book.price)}</span>{book.salePrice && <span className="text-muted-foreground line-through">{formatPrice(book.price)}</span>}</span></span>
                  </button>
                );
              })}
            </div>

            <Link href="/store?type=book" className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/10 bg-surface px-4 py-3 text-sm font-semibold text-primary transition-colors hover:border-accent/30 hover:bg-accent/5 hover:text-accent-dark sm:hidden"><ShoppingCart className="h-4 w-4" />Browse all books</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
