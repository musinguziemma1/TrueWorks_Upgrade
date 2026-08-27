"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">Preview</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
              See What You&apos;re Getting
            </h2>
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
          className="mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Preview
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            See What You&apos;re Getting
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
            A look inside the dashboards and systems our customers use every day.
          </p>
        </motion.div>
      </div>

      {/* Marquee */}
      <div className="group relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />

        {items.length > 0 ? (
          <div className="marquee-container flex w-max gap-6 px-6 group-hover:[animation-play-state:paused] lg:px-8">
            {doubled.map((item, i) => (
              <Link
                key={`${item._id}-${i}`}
                href={`/store/${item.slug}`}
                className="w-[320px] shrink-0 overflow-hidden rounded-xl border border-border/70 bg-white shadow-card transition-shadow duration-300 hover:shadow-elevated sm:w-[380px]"
              >
                <div className="relative h-52 overflow-hidden bg-muted">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="380px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="text-sm font-medium text-muted">{item.name}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-primary">{item.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted line-clamp-2">
                    {item.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-12 text-sm text-muted">
            No featured products yet.
          </div>
        )}
      </div>

      <style jsx global>{`
        .marquee-container {
          animation: marquee-scroll 30s linear infinite;
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
