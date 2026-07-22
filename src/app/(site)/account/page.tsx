"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountOverviewPage() {
  const { user } = useUser();
  const orders = useQuery(api.orders.listMine);
  const downloads = useQuery(api.downloads.listMine);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
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
          <CardTitle>Orders</CardTitle>
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
          <CardTitle>Downloads</CardTitle>
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
    </div>
  );
}
