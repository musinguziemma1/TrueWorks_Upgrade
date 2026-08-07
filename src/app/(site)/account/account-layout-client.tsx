"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
}

export default function AccountLayoutClient({
  children,
  tabs,
}: {
  children: React.ReactNode;
  tabs: Tab[];
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-primary">My Account</h1>
        {isLoaded && user && (
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {user.firstName ?? user.username ?? "there"}.
          </p>
        )}
      </div>
      <div className="mb-6 flex gap-1 border-b border-border" role="tablist">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={isActive(t.href)}
            className={cn(
              "relative rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors",
              isActive(t.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {t.label}
            {isActive(t.href) && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
