"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn, slugify } from "@/lib/utils";
import { useCart } from "@/components/layout/cart-context";
import { useFormatPrice } from "@/lib/use-format-price";
import { Stars } from "@/components/product/stars";
import { Button } from "@/components/ui/button";

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

export function ProductCard({ product, className }: ProductCardProps) {
  const formatPrice = useFormatPrice();
  const { addItem } = useCart();
  const href = `/store/${product.slug}`;
  const price = product.salePrice ?? product.price;
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;

  const handleAdd = () => {
    addItem({
      id: product._id,
      name: product.name,
      price,
      image: product.thumbnail || "",
      slug: product.slug,
    });
    toast.success("Added to cart", {
      description: product.name,
    });
  };

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated",
        className
      )}
    >
      <Link href={href} className="relative block focus-visible:outline-none" tabIndex={-1} aria-hidden>
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/80 to-primary p-5">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              <div className="absolute inset-x-5 top-5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/40" />
                <span className="h-2 w-2 rounded-full bg-white/30" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
              </div>
              <div className="absolute inset-x-5 bottom-5 space-y-2">
                <div className="h-1.5 w-2/3 rounded-full bg-white/35" />
                <div className="flex items-end gap-1.5">
                  {[40, 65, 50, 80, 60].map((h, i) => (
                    <span
                      key={i}
                      className="w-6 rounded-sm bg-white/25"
                      style={{ height: `${(h / 100) * 40 + 8}px` }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
          <span className="absolute right-4 top-4 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {product.category}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={href} className="focus-visible:outline-none">
          <h3 className="font-heading text-lg leading-snug text-primary transition-colors group-hover:text-accent-dark">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.shortDescription}</p>

        <div className="mt-3 flex items-center gap-2">
          <Stars rating={product.rating} />
          <span className="text-xs text-muted">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-lg font-bold text-primary">{formatPrice(price)}</span>
            {product.salePrice && (
              <span className="text-sm text-muted line-through">{formatPrice(product.price)}</span>
            )}
          </div>
          {discount && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-dark">
              -{discount}%
            </span>
          )}
        </div>

        <Button onClick={handleAdd} variant="outline" className="mt-4 w-full border-primary/20 text-primary hover:bg-primary hover:text-white">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </article>
  );
}
