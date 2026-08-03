"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/components/layout/wishlist-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/layout/cart-context";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function WishlistContent() {
  const { items, removeItem } = useWishlist();
  const cart = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="font-heading text-xl font-semibold text-primary">
          Your wishlist is empty
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse the store and save products you love.
        </p>
        <Link
          href="/store"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Browse Store
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {items.length} {items.length === 1 ? "item" : "items"} in your wishlist.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative aspect-video bg-surface">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/30">
                  <Heart className="h-10 w-10" />
                </div>
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <Link
                  href={`/store/${item.slug}`}
                  className="font-medium text-primary hover:underline line-clamp-2"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-lg font-semibold text-[#0B2545]">
                  {fmtMoney(item.price)}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/store/${item.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  <ShoppingCart className="h-4 w-4" />
                  View
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
