"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  Eye,
  Share2,
  BadgePercent,
  Copy,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Stars } from "./stars";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/layout/cart-context";
import { useWishlist } from "@/components/layout/wishlist-context";
import { useFormatPrice } from "@/lib/use-format-price";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExcelPreviewDialog } from "@/components/ui/excel-preview-dialog";

export interface StoreProduct {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  category: string;
  thumbnail: string;
  galleryImages: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  fileType: string;
  tags: string[];
  status: string;
  downloadableFile?: string;
  downloadLimit?: number;
  downloadExpiry?: number;
  version?: string;
  changelog?: string;
  description: string;
  sku: string;
  industry: string;
  fileSize?: string;
  demoVideo?: string;
  seoTitle?: string;
  seoDescription?: string;
  faqs: { question: string; answer: string }[];
  totalSales: number;
  createdAt: number;
  updatedAt: number;
}

interface ProductCardProps {
  product: StoreProduct;
  className?: string;
}

function ShareModal({
  product,
  open,
  onClose,
}: {
  product: StoreProduct;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/store/${product.slug}` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      color: "bg-[#25D366] hover:bg-[#20BD5A]",
      href: `https://wa.me/?text=${encodeURIComponent(`${product.name} - ${url}`)}`,
    },
    {
      name: "Twitter",
      color: "bg-[#1DA1F2] hover:bg-[#1A8CD8]",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2] hover:bg-[#166FE5]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: "LinkedIn",
      color: "bg-[#0A66C2] hover:bg-[#0958A8]",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: "Email",
      color: "bg-primary hover:bg-primary/90",
      href: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(`Check out this template: ${url}`)}`,
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:bg-surface"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="font-heading text-lg font-semibold text-primary mb-1">Share Product</h3>
        <p className="text-sm text-muted mb-5">{product.name}</p>

        <div className="grid grid-cols-5 gap-2 mb-5">
          {shareOptions.map((opt) => (
            <a
              key={opt.name}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-white text-[10px] font-medium transition-all hover:scale-105",
                opt.color
              )}
            >
              <Share2 className="h-4 w-4" />
              {opt.name}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted font-mono">
            {url}
          </div>
          <Button
            size="sm"
            variant={copied ? "default" : "outline"}
            onClick={handleCopy}
            className={cn(
              "shrink-0 gap-1.5",
              copied && "bg-green-600 hover:bg-green-600 text-white border-green-600"
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product, className }: ProductCardProps) {
  const formatPrice = useFormatPrice();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const href = `/store/${product.slug}`;
  const price = product.salePrice ?? product.price;
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;
  const inWishlist = isInWishlist(product._id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product._id,
      name: product.name,
      price,
      image: product.thumbnail || "",
      slug: product.slug,
    });
    toast.success("Added to cart", { description: product.name });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleItem({
      id: product._id,
      name: product.name,
      slug: product.slug,
      price,
      image: product.thumbnail || "",
    });
    toast.success(added ? "Added to wishlist" : "Removed from wishlist", {
      description: product.name,
    });
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.downloadableFile && /excel|csv|xlsx|xls|xlsm|xlsb/i.test(product.fileType)) {
      setPreviewOpen(true);
    } else {
      router.push(href);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };

  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elevated",
          className
        )}
      >
        {/* Image area */}
        <div
          className="relative h-48 cursor-pointer overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary"
          onClick={handleView}
        >
            {product.thumbnail && !imgError ? (
              <Image
                src={product.thumbnail}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImgError(true)}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                    <ShoppingCart className="h-6 w-6 text-white/70" />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                    {product.fileType}
                  </span>
                </div>
              </div>
            )}

            {/* Top badges */}
            <div className="absolute left-4 top-4 flex flex-col gap-1.5">
              {product.featured && (
                <Badge className="bg-accent text-primary-dark border-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 w-fit">
                  Featured
                </Badge>
              )}
              {discount && (
                <Badge className="bg-red-500 text-white border-0 text-[10px] font-bold px-2 py-0.5 w-fit flex items-center gap-1">
                  <BadgePercent className="h-3 w-3" />
                  -{discount}%
                </Badge>
              )}
            </div>

            {/* Category pill */}
            <span className="absolute right-4 top-4 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm border border-white/10">
              {product.category.split(" ")[0]}
            </span>

            {/* Quick action overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleView}
                className="flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-primary shadow-lg hover:bg-white transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                Quick View
              </button>
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg hover:bg-white transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute right-3 top-[188px] z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-md transition-all duration-200 hover:scale-110",
            inWishlist
              ? "bg-red-500 border-red-500 text-white"
              : "bg-white/95 border-white/80 text-muted hover:text-red-500 hover:border-red-200"
          )}
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
        </button>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <Link href={href} className="focus-visible:outline-none">
            <h3 className="font-heading text-[1.05rem] leading-snug font-semibold text-primary transition-colors group-hover:text-accent-dark line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {product.shortDescription}
          </p>

          {/* Rating + sales */}
          {product.reviewCount > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Stars rating={product.rating} starClassName="h-3.5 w-3.5" />
                <span className="ml-1 text-xs font-medium text-foreground">{product.rating}</span>
              </div>
              <span className="text-xs text-muted">({product.reviewCount} reviews)</span>
            </div>
          )}

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-medium text-muted"
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
                +{product.tags.length - 3}
              </span>
            )}
          </div>

          {/* Price + Add to cart */}
          <div className="mt-auto pt-4">
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-heading text-xl font-bold text-primary leading-none">
                  {formatPrice(price)}
                </span>
                {product.salePrice && (
                  <span className="mt-0.5 text-sm text-muted line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              {product.totalSales > 0 && (
                <span className="text-[11px] text-muted">
                  {product.totalSales} sold
                </span>
              )}
            </div>
            <Button
              onClick={handleAdd}
              className="mt-4 w-full rounded-xl bg-primary text-white hover:bg-primary/90 shadow-sm font-semibold text-sm h-11"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      </article>

      <ShareModal product={product} open={shareOpen} onClose={() => setShareOpen(false)} />

      {product.downloadableFile && /excel|csv|xlsx|xls|xlsm|xlsb/i.test(product.fileType) && (
        <ExcelPreviewDialog
          url={product.downloadableFile}
          fileName={product.name}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
    </>
  );
}
