"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { convexClient } from "@/lib/convex";

export default function ProductShowcase() {
  if (!convexClient) return null;
  return <ProductShowcaseInner />;
}

function ProductShowcaseInner() {
  const products = useQuery(api.products.list, { featured: true });
  const items = (products?.items ?? []).filter((p) => p.status === "published");
  const doubled = [...items, ...items];

  if (products === undefined) {
    return (
      <section className="bg-white py-20 lg:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">Preview</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
                See What You&apos;re Getting
              </h2>
            </div>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[320px] shrink-0 animate-pulse sm:w-[380px]">
                <div className="h-52 rounded-t-xl bg-muted" />
                <div className="space-y-2 rounded-b-xl border border-t-0 border-border/70 p-5">
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-20 lg:py-24 overflow-hidden">
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
              Preview
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
              See what you&apos;re getting
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
              A look inside the dashboards and systems our customers use every
              day.
            </p>
          </div>
          <Link
            href="/store"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-accent-dark"
          >
            View all templates
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>

      {/* Marquee */}
      <div className="group/marquee relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent sm:w-40" />

        {items.length > 0 ? (
          <div className="marquee-container flex w-max gap-6 px-6 group-hover/marquee:[animation-play-state:paused] lg:px-8">
            {doubled.map((item, i) => (
              <Link
                key={`${item._id}-${i}`}
                href={`/store/${item.slug}`}
                className="group relative w-[320px] shrink-0 overflow-hidden rounded-xl border border-border/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated sm:w-[380px]"
              >
                <div className="relative h-56 overflow-hidden bg-muted">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="380px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  >
                    <div className="flex w-full items-center justify-between p-4 text-white">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <Download className="h-3.5 w-3.5" />
                        View template
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>

                  {item.category && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-primary">
                    {item.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {item.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
            <p className="font-heading text-base font-semibold text-primary">
              No featured products yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Featured products will appear here as they&apos;re published.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .marquee-container {
          animation: marquee-scroll 36s linear infinite;
        }
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
