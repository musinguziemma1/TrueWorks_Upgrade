"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  Eye,
  X,
  Heart,
  Share2,
  Copy,
  Sparkles,
  Package,
  Award,
  Clock,
  FileType2,
  Hash,
  Building2,
  ListChecks,
  TrendingUp,
  HelpCircle,
  Quote,
  ArrowUpRight,
  MessageCircle,
  CircleDollarSign,
  Mail,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/layout/cart-context";
import { useWishlist } from "@/components/layout/wishlist-context";
import { useAnalytics } from "@/lib/use-analytics";
import { useFormatPrice } from "@/lib/use-format-price";
import { ProductCard, type StoreProduct } from "@/components/product/product-card";
import { Stars } from "@/components/product/stars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ExcelPreviewDialog } from "@/components/ui/excel-preview-dialog";
import { useSignedPreviewUrl } from "@/lib/use-signed-preview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Id } from "@convex/_generated/dataModel";

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
  const { toggleItem, isInWishlist } = useWishlist();
  const { track } = useAnalytics();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Captured once per mount so relative date formatting stays pure during render.
  const [nowTs] = useState(() => Date.now());

  const preview = useSignedPreviewUrl();

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

  // Recommended strip: try featured in the same category first, fall back to
  // global featured. The list is computed after `p` is defined below so we can
  // exclude the current product.
  const recommendedInCategory = useQuery(
    api.products.list,
    product
      ? { status: "published", category: product.category, featured: true, limit: 4 }
      : "skip"
  );
  const recommendedFeatured = useQuery(
    api.products.list,
    product
      ? { status: "published", featured: true, limit: 8 }
      : "skip"
  );
  const recommended = useMemo(() => {
    if (!product) return [] as StoreProduct[];
    const selfId = product._id;
    const pickFrom = (src: { items: StoreProduct[] } | undefined) => {
      if (!src) return [] as StoreProduct[];
      return src.items.filter((r) => r._id !== selfId);
    };
    const inCat = pickFrom(recommendedInCategory as { items: StoreProduct[] } | undefined);
    if (inCat.length >= 4) return inCat.slice(0, 4);
    const all = pickFrom(recommendedFeatured as { items: StoreProduct[] } | undefined);
    const merged = [...inCat];
    for (const r of all) {
      if (merged.length >= 4) break;
      if (!merged.find((m) => m._id === r._id)) merged.push(r);
    }
    return merged;
  }, [recommendedInCategory, recommendedFeatured, product]);

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
    } catch {
      toast.error("Failed to submit review", { description: "Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts: number) => {
    const diff = nowTs - ts;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleNativeShare = async () => {
    if (typeof window === "undefined") return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: p.name, text: p.shortDescription, url: window.location.href });
        return;
      } catch {
        // fall back
      }
    }
    handleCopyLink();
  };

  const shareUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
  const shareText = encodeURIComponent(p.name);
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const mailtoShareUrl = `mailto:?subject=${shareText}&body=${shareUrl}`;

  const handleToggleWishlist = () => {
    const added = toggleItem({
      id: p._id,
      name: p.name,
      slug: p.slug,
      price,
      image: p.thumbnail || "",
    });
    track("add_to_cart", {
      productId: p._id,
      productName: p.name,
      category: p.category,
    });
    toast.success(added ? "Added to wishlist" : "Removed from wishlist", { description: p.name });
  };

  return (
    <>
      <div className="min-h-screen bg-surface">
        {/* ─── Breadcrumb ──────────────────────────────────────────── */}
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
          {/* ─── Sticky 2-col: gallery + buy box ─────────────────────── */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            {/* Gallery (sticky on desktop) */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card bg-gradient-to-br from-primary/80 to-primary")}>
                {gallery.length > 0 ? (
                  <Image
                    src={gallery[selectedImage]}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover"
                    priority
                  />
                ) : p.thumbnail ? (
                  <Image
                    src={p.thumbnail}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
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
                {p.featured && (
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-dark shadow-md">
                    <Sparkles className="h-2.5 w-2.5" />
                    Featured
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

              {/* Mini social row under gallery */}
              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={handleToggleWishlist}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-all",
                    isInWishlist(p._id)
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-border bg-white text-muted hover:border-primary/30 hover:text-primary"
                  )}
                  aria-label={isInWishlist(p._id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={cn("h-4 w-4", isInWishlist(p._id) && "fill-current")} />
                  {isInWishlist(p._id) ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleNativeShare}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-muted transition-all hover:border-primary/30 hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-all",
                    copied
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-border bg-white text-muted hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>

            {/* Buy box (sticky on desktop) */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {p.category}
                  </span>
                  {p.industry && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <Building2 className="h-3 w-3" />
                      {p.industry}
                    </span>
                  )}
                </div>

                <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight text-primary md:text-4xl">
                  {p.name}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <Stars rating={p.rating} starClassName="h-4 w-4" />
                    <span className="font-semibold text-foreground">{p.rating}</span>
                    <span>({p.reviewCount} reviews)</span>
                  </span>
                  <span className="text-border">|</span>
                  {p.totalSales > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      {p.totalSales.toLocaleString()} sold
                    </span>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-baseline gap-3">
                  <span className="font-heading text-4xl font-bold text-primary">
                    {formatPrice(price)}
                  </span>
                  {p.salePrice && !isBundle && !selectedTierObj && (
                    <>
                      <span className="text-base text-muted line-through">
                        {formatPrice(p.price)}
                      </span>
                      <Badge className="gradient-gold border-0 text-primary-dark">
                        -{p.price > 0 ? Math.round(((p.price - p.salePrice) / p.price) * 100) : 0}%
                      </Badge>
                    </>
                  )}
                </div>

                <p className="mt-5 leading-relaxed text-muted">{p.shortDescription}</p>

                {/* Specs row */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: FileType2, label: "Format", value: p.fileType },
                    p.fileSize ? { icon: Package, label: "Size", value: p.fileSize } : null,
                    p.version ? { icon: Hash, label: "Version", value: `v${p.version}` } : null,
                    p.downloadLimit
                      ? { icon: RefreshCw, label: "Downloads", value: `${p.downloadLimit}` }
                      : { icon: ShieldCheck, label: "Updates", value: "Lifetime" },
                  ]
                    .filter(Boolean)
                    .map((spec) => spec && (
                      <div
                        key={spec.label}
                        className="rounded-xl border border-border/70 bg-surface px-3 py-2.5"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                          <spec.icon className="h-3 w-3" />
                          {spec.label}
                        </div>
                        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{spec.value}</p>
                      </div>
                    ))}
                </div>

                {p.hasDownloadableFile && /excel|csv|xlsx|xls|xlsm|xlsb/i.test(p.fileType) && (
                  <div className="mt-5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => { preview.resolve(product?._id as never); setPreviewOpen(true); }}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Preview the spreadsheet
                    </Button>
                    <ExcelPreviewDialog
                      url={preview.url ?? ""}
                      fileName={p.name}
                      open={previewOpen}
                      onOpenChange={setPreviewOpen}
                      loadingUrl={preview.loading}
                    />
                  </div>
                )}

                {/* Primary CTAs */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
                    Buy Now · {formatPrice(price)}
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

                {/* Trust strip */}
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5">
                  {trustBadges.map((badge) => (
                    <div
                      key={badge.label}
                      className="flex flex-col items-center gap-1.5 text-center"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
                        <badge.icon className="h-4 w-4" />
                      </span>
                      <span className="text-[11px] font-medium leading-tight text-muted">
                        {badge.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Highlights bar (navy band) ─────────────────────────── */}
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border shadow-card sm:grid-cols-4">
            {[
              { icon: ListChecks, label: "Ready to use", value: "Plug & play" },
              { icon: RefreshCw, label: "Updates", value: p.downloadLimit ? `${p.downloadLimit} downloads` : "Lifetime" },
              { icon: Clock, label: "Onboarding", value: "< 5 min" },
              { icon: Award, label: "Support", value: "30-day" },
            ].map((h) => (
              <div key={h.label} className="flex flex-col items-start gap-1.5 bg-white p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent-dark">
                  <h.icon className="h-4 w-4" />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{h.label}</p>
                <p className="font-heading text-base font-semibold text-primary">{h.value}</p>
              </div>
            ))}
          </div>

          {/* ─── 2/3 + 1/3: description + sticky sidebar ──────────────── */}
          <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-12 lg:mt-20">
            <div>
              {/* Description */}
              <FadeIn>
                <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8 lg:p-10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileType2 className="h-4 w-4" />
                    </span>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                      About this template
                    </h2>
                  </div>

                  <div className="mt-5 rounded-xl border-l-4 border-accent bg-accent/[0.06] p-5">
                    <Quote className="h-4 w-4 text-accent-dark" />
                    <p className="mt-2 text-base leading-relaxed text-foreground">
                      {p.shortDescription}
                    </p>
                  </div>

                  <div
                    className="prose prose-sm mt-6 max-w-none leading-relaxed text-muted [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-primary [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-primary [&_p]:mb-3 [&_img]:my-6 [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: p.description }}
                  />

                  {p.changelog && (
                    <div className="mt-8 border-t border-border pt-6">
                      <h3 className="text-sm font-semibold text-primary">Changelog</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{p.changelog}</p>
                    </div>
                  )}

                  {p.tags.length > 0 && (
                    <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-6">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                        Tags
                      </span>
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>

              {/* FAQ */}
              {p.faqs && p.faqs.length > 0 && (
                <FadeIn delay={0.1}>
                  <div className="mt-8 rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <HelpCircle className="h-4 w-4" />
                      </span>
                      <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                        Frequently asked questions
                      </h2>
                    </div>
                    <Accordion className="mt-4">
                      {p.faqs.map((f, i) => (
                        <AccordionItem key={i} value={`faq-${i}`}>
                          <AccordionTrigger>{f.question}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted">{f.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </FadeIn>
              )}

              {/* Reviews */}
              <FadeIn delay={0.15}>
                <div className="mt-8 rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Star className="h-4 w-4" />
                        </span>
                        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                          Customer reviews
                        </h2>
                      </div>
                      <div className="mt-4 flex items-baseline gap-3">
                        <span className="font-heading text-4xl font-bold text-primary">{p.rating}</span>
                        <div className="flex flex-col">
                          <Stars rating={p.rating} starClassName="h-4 w-4" />
                          <span className="mt-1 text-xs text-muted">
                            Based on {p.reviewCount} review{p.reviewCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    {reviews && reviews.length > 0 ? (
                      reviews.map((r) => (
                        <div key={r._id} className="flex gap-4 border-b border-border pb-5 last:border-0">
                          <Avatar>
                            <AvatarFallback className="bg-primary/[0.08] font-heading font-semibold text-primary">
                              {r.customerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
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

                  <div className="mt-10 border-t border-border pt-8">
                    <h3 className="font-heading text-lg font-semibold text-primary">Write a Review</h3>
                    <form onSubmit={handleReviewSubmit} className="mt-5 space-y-5">
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                            Email <span className="text-muted">(optional)</span>
                          </label>
                          <Input
                            type="email"
                            value={reviewEmail}
                            onChange={(e) => setReviewEmail(e.target.value)}
                            placeholder="you@example.com"
                          />
                        </div>
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
                </div>
              </FadeIn>
            </div>

            {/* ─── Sticky right sidebar ───────────────────────────── */}
            <aside className="hidden lg:block">
              <div className="sticky top-6 space-y-5">
                {/* Features (from tags + derived) */}
                <FadeIn>
                  <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                    <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <ListChecks className="h-3.5 w-3.5" />
                      </span>
                      What&apos;s included
                    </h3>
                    <ul className="mt-4 space-y-2.5 text-sm">
                      {[
                        "Production-ready {fileType} file".replace("{fileType}", p.fileType),
                        "Step-by-step documentation",
                        "Pre-filled example data",
                        "Editable formulas & validations",
                        p.downloadLimit
                          ? `${p.downloadLimit} download${p.downloadLimit === 1 ? "" : "s"} included`
                          : "Unlimited downloads",
                        "30-day satisfaction guarantee",
                      ].map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-muted">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-dark" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>

                {/* License tiers (if present) */}
                {hasTiers && (
                  <FadeIn delay={0.08}>
                    <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                      <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent-dark">
                          <CircleDollarSign className="h-3.5 w-3.5" />
                        </span>
                        Choose a license
                      </h3>
                      <div className="mt-4 space-y-2">
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
                                "relative flex w-full items-center justify-between rounded-lg border bg-white p-3 text-left transition-all",
                                selected
                                  ? "border-accent ring-1 ring-accent/40"
                                  : "border-border/70 hover:border-primary/25"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                    selected
                                      ? "border-accent bg-accent"
                                      : "border-border"
                                  )}
                                >
                                  {selected && <Check className="h-2.5 w-2.5 text-primary-dark" strokeWidth={4} />}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-primary">{tier.name}</p>
                                  {tier.quantity && (
                                    <p className="text-[11px] text-muted">Up to {tier.quantity} seats</p>
                                  )}
                                </div>
                              </div>
                              <span className="font-heading text-sm font-bold text-primary">
                                {formatPrice(tierPrice)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Bundle members (if bundle) */}
                {isBundle && members.length > 0 && (
                  <FadeIn delay={0.12}>
                    <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                      <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md gradient-gold text-primary-dark">
                          <Package className="h-3.5 w-3.5" />
                        </span>
                        This bundle includes
                      </h3>
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
                            <span className="shrink-0 text-xs font-medium text-muted">
                              {formatPrice(m.salePrice ?? m.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-[11px] text-muted">Total bundle value</span>
                        <span className="font-heading text-base font-bold text-primary">
                          {formatPrice(members.reduce((sum, m) => sum + (m.salePrice ?? m.price), 0))}
                        </span>
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Specifications table */}
                <FadeIn delay={0.16}>
                  <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                    <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <ListChecks className="h-3.5 w-3.5" />
                      </span>
                      Specifications
                    </h3>
                    <dl className="mt-4 space-y-2.5 text-sm">
                      {[
                        { label: "Category", value: p.category },
                        { label: "Industry", value: p.industry },
                        { label: "SKU", value: p.sku },
                        { label: "Format", value: p.fileType },
                        p.fileSize ? { label: "File size", value: p.fileSize } : null,
                        p.version ? { label: "Version", value: `v${p.version}` } : null,
                        p.downloadLimit ? { label: "Downloads", value: `${p.downloadLimit}` } : null,
                      ]
                        .filter(Boolean)
                        .map((row) => row && (
                          <div key={row.label} className="flex items-center justify-between gap-3">
                            <dt className="text-muted">{row.label}</dt>
                            <dd className="truncate font-semibold text-foreground">{row.value}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </FadeIn>

                {/* Share card */}
                <FadeIn delay={0.2}>
                  <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                    <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent-dark">
                        <Share2 className="h-3.5 w-3.5" />
                      </span>
                      Share this
                    </h3>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a
                        href={twitterShareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:scale-[1.02] hover:border-primary/40 hover:bg-white"
                      >
                        <TwitterIcon className="h-3.5 w-3.5" />
                        Twitter
                      </a>
                      <a
                        href={linkedinShareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:scale-[1.02] hover:border-primary/40 hover:bg-white"
                      >
                        <LinkedinIcon className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                      <a
                        href={mailtoShareUrl}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:scale-[1.02] hover:border-primary/40 hover:bg-white"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all hover:scale-[1.02]",
                          copied
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                            : "border-border bg-surface text-foreground hover:border-primary/40 hover:bg-white"
                        )}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </FadeIn>

                {/* Related (in sidebar) */}
                {related.length > 0 && (
                  <FadeIn delay={0.24}>
                    <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                      <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </span>
                        Related in {p.category}
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {related.map((rp) => (
                          <li key={rp._id}>
                            <Link
                              href={`/store/${rp.slug}`}
                              className="group flex items-start gap-3"
                            >
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary group-hover:text-accent">
                                {rp.thumbnail ? (
                                  <Image src={rp.thumbnail} alt={rp.name} width={48} height={48} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-4 w-4" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                  {rp.name}
                                </p>
                                <p className="mt-0.5 text-[11px] font-semibold text-accent-dark">
                                  {formatPrice(rp.salePrice ?? rp.price)}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeIn>
                )}

                {/* CTA card */}
                <FadeIn delay={0.28}>
                  <div className="gradient-brand relative overflow-hidden rounded-xl p-6 shadow-card">
                    <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                    <div className="relative">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-accent-light">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                      <h3 className="mt-4 font-heading text-base font-semibold text-white">
                        Need a custom build?
                      </h3>
                      <p className="mt-1.5 text-sm text-white/85">
                        We design bespoke business operating systems for organizations of every size.
                      </p>
                      <Link
                        href="/contact"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light transition-transform hover:translate-x-0.5"
                      >
                        Talk to our team
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </aside>
          </div>

          {/* ─── Co-purchased ─────────────────────────────────────── */}
          {coPurchased !== undefined && coPurchased.length > 0 && (
            <div className="mt-16 lg:mt-20">
              <div className="mb-8 flex items-end justify-between">
                <div>
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

          {/* ─── Recommended for you ──────────────────────────────── */}
          {recommended.length > 0 && (
            <div className="mt-16 lg:mt-20">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                    Recommended for you
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-primary md:text-3xl">
                    More {p.category} picks
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Hand-picked by our team — premium templates in the same space as {p.name}.
                  </p>
                </div>
                <Link
                  href={`/store?category=${encodeURIComponent(p.category)}`}
                  className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-accent-dark sm:inline-flex"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.map((rp) => (
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
