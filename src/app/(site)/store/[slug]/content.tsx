"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Check,
  ShieldCheck,
  Download,
  RefreshCw,
  ChevronRight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatPrice, slugify } from "@/lib/utils";
import { getRelatedProducts, type Product } from "@/lib/products";
import { useCart } from "@/components/layout/cart-context";
import { ProductCard } from "@/components/product/product-card";
import { Stars } from "@/components/product/stars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const trustBadges = [
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Download, label: "Instant Download" },
  { icon: RefreshCw, label: "30-Day Guarantee" },
];

const reviewData = [
  { initials: "JK", name: "John K.", time: "2 weeks ago", rating: 5, text: "Excellent template! Saved me hours of work. The dashboard is very intuitive and the instructions are clear." },
  { initials: "AM", name: "Alice M.", time: "1 month ago", rating: 4, text: "Good product overall. The KPI tracking is great. Would love to see more customization options in future updates." },
  { initials: "PN", name: "Peter N.", time: "3 months ago", rating: 5, text: "Perfect for our organization. The board was impressed with the presentation-ready charts. Highly recommended." },
];

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showSticky, setShowSticky] = useState(false);

  const price = product.salePrice ?? product.price;
  const related = getRelatedProducts(product, 3);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const addToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price,
      image: product.gradient,
      slug: slugify(product.name),
    });
    toast.success("Added to cart", { description: product.name });
  };

  const buyNow = () => {
    addToCart();
    router.push("/checkout");
  };

  const galleryFrames = [
    `bg-gradient-to-br ${product.gradient}`,
    `bg-gradient-to-tr ${product.gradient}`,
    `bg-gradient-to-bl ${product.gradient}`,
    `bg-gradient-to-tl ${product.gradient}`,
  ];

  return (
    <>
      <div className="min-h-screen bg-surface">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-white">
          <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-1.5 px-6 py-4 text-sm text-muted lg:px-8">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/store" className="transition-colors hover:text-primary">Store</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate font-medium text-foreground">{product.name}</span>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Gallery */}
            <div>
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card", galleryFrames[selectedImage])}>
                <div className="absolute inset-0 flex flex-col justify-between p-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                      Template Preview
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="h-16 flex-1 rounded-md bg-white/15" />
                      <div className="h-16 flex-1 rounded-md bg-white/15" />
                      <div className="h-16 flex-1 rounded-md bg-white/15" />
                    </div>
                    <div className="flex h-20 items-end gap-2 rounded-md bg-white/10 p-3">
                      {[45, 70, 55, 85, 60, 95, 75, 88].map((h, j) => (
                        <span key={j} className="flex-1 rounded-sm bg-white/35" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
                {product.salePrice && (
                  <span className="absolute left-5 top-5 rounded-full gradient-gold px-3 py-1 text-xs font-bold text-primary-dark shadow-md">
                    Save {formatPrice(product.price - product.salePrice)}
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {galleryFrames.map((frame, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Preview ${i + 1}`}
                    className={cn(
                      "aspect-[4/3] rounded-lg transition-all duration-200",
                      frame,
                      selectedImage === i
                        ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                        : "opacity-50 hover:opacity-100"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {product.category}
              </span>
              <h1 className="mt-4 font-heading text-3xl font-semibold text-primary md:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex items-center gap-2.5">
                <Stars rating={product.rating} starClassName="h-4 w-4" />
                <span className="text-sm text-muted">
                  {product.rating} · {product.reviews} reviews
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-baseline gap-3">
                <span className="font-heading text-3xl font-bold text-primary">
                  {formatPrice(price)}
                </span>
                {product.salePrice && (
                  <>
                    <span className="text-lg text-muted line-through">
                      {formatPrice(product.price)}
                    </span>
                    <Badge className="gradient-gold border-0 text-primary-dark">
                      -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                    </Badge>
                  </>
                )}
              </div>

              <p className="mt-6 leading-relaxed text-muted">{product.tagline}</p>

              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  What&apos;s Included
                </h2>
                <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {product.whatIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Compatibility
                </h2>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {product.compatibility.map((comp) => (
                    <span
                      key={comp}
                      className="rounded-full border border-primary/10 bg-primary/[0.04] px-3.5 py-1.5 text-xs font-medium text-primary"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={addToCart}
                  variant="outline"
                  size="lg"
                  className="h-12 flex-1 border-primary/25 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  onClick={buyNow}
                  size="lg"
                  className="h-12 flex-1 gradient-gold text-sm font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Buy Now — {formatPrice(price)}
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {trustBadges.map((badge) => (
                  <div
                    key={badge.label}
                    className="flex flex-col items-center gap-2 rounded-lg border border-border/70 bg-white p-3.5"
                  >
                    <badge.icon className="h-4 w-4 text-accent-dark" />
                    <span className="text-center text-[11px] font-medium leading-tight text-muted">
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-16 rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8 lg:mt-20">
            <Tabs defaultValue="description">
              <TabsList className="mb-8 flex-wrap">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="whats-included">What&apos;s Included</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({product.reviews})</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="max-w-3xl">
                <p className="leading-relaxed text-muted">{product.description}</p>
              </TabsContent>
              <TabsContent value="whats-included" className="max-w-3xl">
                <ul className="space-y-3">
                  {product.whatIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="faq" className="max-w-3xl">
                <Accordion>
                  {product.faq.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger>{f.q}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted">{f.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
              <TabsContent value="reviews" className="max-w-3xl">
                <div className="space-y-6">
                  {reviewData.map((r, i) => (
                    <div key={i} className="flex gap-4 border-b border-border pb-6 last:border-0">
                      <Avatar>
                        <AvatarFallback className="bg-primary/[0.08] font-heading font-semibold text-primary">
                          {r.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">{r.name}</span>
                          <span className="text-xs text-muted">{r.time}</span>
                        </div>
                        <Stars rating={r.rating} className="mb-2" />
                        <p className="text-sm leading-relaxed text-muted">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-16 lg:mt-20">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                    Keep Exploring
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-primary md:text-3xl">
                    Related {product.category} Templates
                  </h2>
                </div>
                <Link
                  href={`/store?category=${encodeURIComponent(product.category)}`}
                  className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-accent-dark sm:inline-flex"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {related.map((rp) => (
                  <ProductCard key={rp.id} product={rp} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: showSticky ? 0 : 100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 p-4 shadow-modal backdrop-blur-lg lg:hidden"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            {product.salePrice ? (
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-lg font-bold text-primary">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-sm text-muted line-through">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <span className="font-heading text-lg font-bold text-primary">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <Button onClick={addToCart} className="gradient-gold font-semibold text-primary-dark">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </motion.div>
    </>
  );
}
