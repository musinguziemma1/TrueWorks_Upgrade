"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { useWishlist } from "@/components/layout/wishlist-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShoppingCart, Download, RotateCcw } from "lucide-react";

export default function AccountOverviewContent() {
  const { user } = useUser();
  const orders = useQuery(api.orders.listMine);
  const downloads = useQuery(api.downloads.listMine);
  const returns = useQuery(api.returns.listMine);
  const { totalItems } = useWishlist();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">
            {user?.fullName ?? user?.username ?? "—"}
          </p>
          <p className="text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-primary">
            {orders === undefined ? "—" : orders.length}
          </p>
          <Link href="/account/orders" className="text-sm text-accent hover:underline">
            View orders →
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-primary">
            {downloads === undefined ? "—" : downloads.length}
          </p>
          <Link
            href="/account/downloads"
            className="text-sm text-accent hover:underline"
          >
            View downloads →
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-primary" />
            Wishlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-primary">{totalItems}</p>
          <Link
            href="/account/wishlist"
            className="text-sm text-accent hover:underline"
          >
            View wishlist →
          </Link>
        </CardContent>
      </Card>
      {returns && returns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="h-4 w-4 text-primary" />
              Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{returns.length}</p>
            <Link
              href="/account/returns"
              className="text-sm text-accent hover:underline"
            >
              View returns →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
