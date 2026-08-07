"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Check,
  ShieldCheck,
  Download,
  RefreshCw,
  ChevronRight,
  Zap,
  Loader2,
  Star,
  Play,
  X,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/layout/cart-context";
import { useAnalytics } from "@/lib/use-analytics";
import { useFormatPrice } from "@/lib/use-format-price";
import { ProductCard, type StoreProduct } from "@/components/product/product-card";
import { Stars } from "@/components/product/stars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ExcelPreview } from "@/components/ui/excel-preview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Id } from "@convex/_generated/dataModel";

const trustBadges = [
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Download, label: "Instant Download" },
  { icon: RefreshCw, label: "30-Day Guarantee" },
];

export default function ProductDetail() {
  const formatPrice = useFormatPrice();
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { track } = useAnalytics();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const createReview = useMutation(api.reviews.create);

  const product = useQuery(api.products.getBySlug, { slug: params.slug });
  const reviews = useQuery(
    api.reviews.listApproved,
    product ? { productId: product._id } : "skip"
  );
  const relatedProducts = useQuery(
    api.products.getRelatedByIds,
    product?.relatedProductIds && product.relatedProductIds.length > 0
      ? { ids: product.relatedProductIds }
      : "skip"
  );
  const bundleMembers = useQuery(
    api.products.getBundleMembers,
    product?.bundleProductIds && product.bundleProductIds.length > 0
      ? { ids: product.bundleProductIds }
      : "skip"
  );
  const coPurchased = useQuery(
    api.orders.getCoPurchased,
    product ? { productId: product._id as Id<"products"> } : "skip"
  );

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const viewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (product && product._id && viewedRef.current !== product._id) {
      viewedRef.current = product._id;
      track("view_product", {
        productId: product._id,
        productName: product.name,
        category: product.category,
      });
    }
  }, [product, track]);

  if (product === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-3xl font-semibold text-primary">Product Not Found</h1>
        <p className="mt-2 text-muted">The product you are looking for does not exist.</p>
        <Link href="/store" className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          Back to Store
        </Link>
      </div>
    );
  }

  const p = product as StoreProduct;
  const hasTiers = !!p.pricingTiers && p.pricingTiers.length > 0;
  const isBundle = !!p.bundleProductIds && p.bundleProductIds.length > 0;
  const members = (bundleMembers ?? []) as StoreProduct[];
  const bundleTotal = isBundle
    ? members.reduce((sum, m) => sum + (m.salePrice ?? m.price), 0)
    : null;
  const selectedTierObj = hasTiers
    ? p.pricingTiers!.find((t) => t.name === selectedTier) ?? null
    : null;
  const price = bundleTotal && bundleTotal > 0
    ? bundleTotal
    : selectedTierObj
    ? selectedTierObj.salePrice ?? selectedTierObj.price
    : p.salePrice ?? p.price;
  const gallery = p.galleryImages?.length > 0 ? p.galleryImages : [];
  const related = (relatedProducts ?? [])
    .filter((rp: StoreProduct) => rp._id !== p._id)
    .slice(0, 3);

  const addToCart = () => {
    addItem({
      id: p._id,
      name: p.name,
      price,
      image: p.thumbnail || "",
      slug: p.slug,
      tier: selectedTierObj?.name,
    });
    track("add_to_cart", {
      productId: p._id,
      productName: p.name,
      category: p.category,
      value: price,
    });
    toast.success("Added to cart", { description: p.name });
  };

  const buyNow = () => {
    addToCart();
    router.push("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewContent.trim() || reviewRating === 0) {
      toast.error("Please fill in all required fields and select a rating.");
      return;
    }
    setSubmitting(true);
    try {
      await createReview({
        productId: product._id as Id<"products">,
        customerName: reviewName.trim(),
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        content: reviewContent.trim(),
        email: reviewEmail.trim() || undefined,
      });
      toast.success("Review submitted!", { description: "Thank you for your feedback." });
      setReviewName("");
      setReviewEmail("");
      setReviewRating(0);
      setReviewTitle("");
      setReviewContent("");
    } catch (err) {
      toast.error("Failed to submit review", { description: "Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts: number) => {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <>
      <div className="min-h-screen bg-surface">
        <div className="border-b border-border bg-white">
          <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-1.5 px-6 py-4 text-sm text-muted lg:px-8">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/store" className="transition-colors hover:text-primary">Store</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate font-medium text-foreground">{p.name}</span>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Gallery */}
            <div>
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card bg-gradient-to-br from-primary/80 to-primary")}>
                {gallery.length > 0 ? (
                  <Image
                    src={gallery[selectedImage]}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                ) : p.thumbnail ? (
                  <Image
                    src={p.thumbnail}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                ) : (
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
                )}
                {p.salePrice && (
                  <span className="absolute left-5 top-5 rounded-full gradient-gold px-3 py-1 text-xs font-bold text-primary-dark shadow-md">
                    Save {formatPrice(p.price - p.salePrice)}
                  </span>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {gallery.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      aria-label={`Preview ${i + 1}`}
                      className={cn(
                        "relative aspect-[4/3] overflow-hidden rounded-lg transition-all duration-200",
                        selectedImage === i
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                          : "opacity-50 hover:opacity-100"
                      )}
                    >
                      <Image src={img} alt={`${p.name} preview ${i + 1}`} fill sizes="25vw" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {p.category}
              </span>
              <h1 className="mt-4 font-heading text-3xl font-semibold text-primary md:text-4xl">
                {p.name}
              </h1>

              <div className="mt-4 flex items-center gap-2.5">
                <Stars rating={p.rating} starClassName="h-4 w-4" />
                <span className="text-sm text-muted">
                  {p.rating} · {p.reviewCount} reviews
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-baseline gap-3">
                <span className="font-heading text-3xl font-bold text-primary">
                  {formatPrice(price)}
                </span>
                {p.salePrice && (
                  <>
                    <span className="text-lg text-muted line-through">
                      {formatPrice(p.price)}
                    </span>
                    <Badge className="gradient-gold border-0 text-primary-dark">
                      -{Math.round(((p.price - p.salePrice) / p.price) * 100)}%
                    </Badge>
                  </>
                )}
              </div>

              <p className="mt-6 leading-relaxed text-muted">{p.shortDescription}</p>

              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Details
                </h2>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary/10 bg-primary/[0.04] px-3.5 py-1.5 text-xs font-medium text-primary">
                    {p.fileType}
                  </span>
                  {p.fileSize && (
                    <span className="rounded-full border border-primary/10 bg-primary/[0.04] px-3.5 py-1.5 text-xs font-medium text-primary">
                      {p.fileSize}
                    </span>
                  )}
                  {p.version && (
                    <span className="rounded-full border border-primary/10 bg-primary/[0.04] px-3.5 py-1.5 text-xs font-medium text-primary">
                      v{p.version}
                    </span>
                  )}
                  {p.downloadLimit && (
                    <span className="rounded-full border border-primary/10 bg-primary/[0.04] px-3.5 py-1.5 text-xs font-medium text-primary">
                      {p.downloadLimit} downloads
                    </span>
                  )}
                </div>
                {p.downloadableFile && /excel|csv|xlsx|xls|xlsm|xlsb/i.test(p.fileType) && (
                  <div className="mt-4">
                    <ExcelPreview url={p.downloadableFile} fileName={p.name} />
                  </div>
                )}
              </div>

              {hasTiers && (
                <div className="mt-9">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Choose a License
                  </h2>
                  <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {p.pricingTiers!.map((tier) => {
                      const active = selectedTierObj?.name === tier.name;
                      const tierPrice = tier.salePrice ?? tier.price;
                      const isFirst = !selectedTierObj && tier.name === p.pricingTiers![0].name;
                      const selected = active || isFirst;
                      return (
                        <button
                          key={tier.name}
                          type="button"
                          onClick={() => setSelectedTier(selected ? null : tier.name)}
                          className={cn(
                            "relative flex flex-col rounded-xl border bg-white p-4 text-left transition-all duration-200",
                            selected
                              ? "border-accent ring-1 ring-accent/40 shadow-sm"
                              : "border-border/70 hover:border-primary/25"
                          )}
                        >
                          {selected && (
                            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full gradient-gold text-primary-dark">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                            {tier.name}
                          </span>
                          <span className="mt-2 flex items-baseline gap-1.5">
                            <span className="font-heading text-lg font-bold text-primary">
                              {formatPrice(tierPrice)}
                            </span>
                            {tier.salePrice && (
                              <span className="text-xs text-muted line-through">
                                {formatPrice(tier.price)}
                              </span>
                            )}
                          </span>
                          {tier.quantity && (
                            <span className="mt-1 text-xs text-muted">
                              Up to {tier.quantity} seats
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {selectedTierObj
                      ? `Licensed for ${selectedTierObj.name}.`
                      : "Select a license tier to see its price."}
                  </p>
                </div>
              )}

              {isBundle && members.length > 0 && (
                <div className="mt-9 rounded-xl border border-primary/10 bg-primary/[0.03] p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-gold">
                      <Check className="h-3.5 w-3.5 text-primary-dark" strokeWidth={3} />
                    </span>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      This Bundle Includes
                    </h2>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {members.map((m) => (
                      <li key={m._id} className="flex items-center justify-between gap-3 text-sm">
                        <Link
                          href={`/store/${m.slug}`}
                          className="flex min-w-0 items-center gap-2 text-foreground transition-colors hover:text-accent-dark"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0 text-secondary" />
                          <span className="truncate">{m.name}</span>
                        </Link>
                        <span className="shrink-0 font-medium text-muted">
                          {formatPrice(m.salePrice ?? m.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted">
                      {members.length} templates in one purchase
                    </span>
                    <span className="font-heading text-lg font-bold text-primary">
                      {formatPrice(members.reduce((sum, m) => sum + (m.salePrice ?? m.price), 0))}
                    </span>
                  </div>
                </div>
              )}

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
                  Buy Now - {formatPrice(price)}
                </Button>
              </div>

              {p.demoVideo && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="mt-3 w-full text-sm font-medium text-muted hover:text-primary"
                  onClick={() => setShowVideo(true)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo Video
                </Button>
              )}

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
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({p.reviewCount})</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="max-w-3xl">
                <div
                  className="prose prose-sm max-w-none leading-relaxed text-muted [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-primary [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-primary [&_p]:mb-3 [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: p.description }}
                />
                {p.changelog && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-primary">Changelog</h3>
                    <p className="mt-2 text-sm text-muted">{p.changelog}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="faq" className="max-w-3xl">
                {p.faqs && p.faqs.length > 0 ? (
                  <Accordion>
                    {p.faqs.map((f, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger>{f.question}</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted">{f.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted">No FAQ available for this product.</p>
                )}
              </TabsContent>
              <TabsContent value="reviews" className="max-w-3xl">
                <div className="space-y-6">
                  {reviews && reviews.length > 0 ? (
                    reviews.map((r) => (
                      <div key={r._id} className="flex gap-4 border-b border-border pb-6 last:border-0">
                        <Avatar>
                          <AvatarFallback className="bg-primary/[0.08] font-heading font-semibold text-primary">
                            {r.customerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary">{r.customerName}</span>
                            {r.verified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                <ShieldCheck className="h-3 w-3" />
                                Verified Purchase
                              </span>
                            )}
                            <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                          </div>
                          <Stars rating={r.rating} className="mb-2" />
                          {r.title && <p className="mb-1 text-sm font-medium text-primary">{r.title}</p>}
                          <p className="text-sm leading-relaxed text-muted">{r.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No reviews yet. Be the first to review this product!</p>
                  )}
                </div>

                {/* Review Form */}
                <div className="mt-10 border-t border-border pt-8">
                  <h3 className="font-heading text-lg font-semibold text-primary">Write a Review</h3>
                  <form onSubmit={handleReviewSubmit} className="mt-5 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-primary">Your Name *</label>
                      <Input
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-primary">
                        Email <span className="text-muted">(to verify your purchase)</span>
                      </label>
                      <Input
                        type="email"
                        value={reviewEmail}
                        onChange={(e) => setReviewEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-primary">Rating *</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                          >
                            <Star
                              className={cn(
                                "h-6 w-6 transition-colors",
                                star <= reviewRating
                                  ? "fill-accent text-accent"
                                  : "fill-border text-border"
                              )}
                            />
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-2 text-sm text-muted">{reviewRating}/5</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-primary">Title <span className="text-muted">(optional)</span></label>
                      <Input
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Summarize your experience"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-primary">Review *</label>
                      <Textarea
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Tell others what you think about this product..."
                        rows={4}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="gradient-gold text-sm font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Frequently bought together */}
          {coPurchased !== undefined && coPurchased.length > 0 && (
            <div className="mt-16 lg:mt-20">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                  Frequently Bought Together
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-primary md:text-3xl">
                  Customers Also Purchased
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Pairs well with {p.name} — chosen by real customers.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {coPurchased.map((cp) => (
                  <ProductCard
                    key={cp._id}
                    product={cp as unknown as StoreProduct}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-16 lg:mt-20">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                    Keep Exploring
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-primary md:text-3xl">
                    Related {p.category} Templates
                  </h2>
                </div>
                <Link
                  href={`/store?category=${encodeURIComponent(p.category)}`}
                  className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-accent-dark sm:inline-flex"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {related.map((rp: StoreProduct) => (
                  <ProductCard key={rp._id} product={rp} />
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
            <span className="font-heading text-lg font-bold text-primary">
              {formatPrice(price)}
            </span>
            {p.salePrice && !bundleTotal && !selectedTierObj && (
              <span className="text-sm text-muted line-through">{formatPrice(p.price)}</span>
            )}
          </div>
          <Button onClick={addToCart} className="gradient-gold font-semibold text-primary-dark">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </motion.div>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-0">
          <button
            onClick={() => setShowVideo(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
          {p.demoVideo && (
            <div className="relative aspect-video w-full">
              {p.demoVideo.includes("youtube.com") || p.demoVideo.includes("youtu.be") ? (
                <iframe
                  src={`https://www.youtube.com/embed/${p.demoVideo.includes("youtu.be") ? p.demoVideo.split("/").pop()?.split("?")[0] : new URL(p.demoVideo).searchParams.get("v") ?? p.demoVideo.split("/").pop()?.split("?")[0]}?autoplay=1`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : p.demoVideo.includes("vimeo.com") ? (
                <iframe
                  src={`https://player.vimeo.com/video/${p.demoVideo.split("/").pop()?.split("?")[0]}?autoplay=1`}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={p.demoVideo}
                  controls
                  autoPlay
                  className="h-full w-full"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
