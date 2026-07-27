"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ShoppingCart, Menu, Mail, Phone, User, LayoutDashboard } from "lucide-react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { convexClient } from "@/lib/convex";
import { useCart } from "@/components/layout/cart-context";
import { useSettings } from "@/lib/settings-context";
import MobileNav from "@/components/layout/mobile-nav";
import { Logo } from "@/components/logo";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

function AdminMenuLink() {
  const isAdmin = useQuery(api.users.isAdmin);
  if (!isAdmin) return null;
  return (
    <UserButton.Link label="Admin Dashboard" labelIcon={<LayoutDashboard className="h-4 w-4" />} href="/admin" />
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const settings = useSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Utility bar */}
      <div className="hidden bg-primary-dark text-white/70 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs lg:px-8">
          <p className="tracking-wide">
            {settings.siteTagline}
          </p>
          <div className="flex items-center gap-6">
            <a
              href="mailto:hello@trueworksug.com"
              className="flex items-center gap-1.5 transition-colors hover:text-accent-light"
            >
              <Mail className="h-3.5 w-3.5 text-accent" />
              hello@trueworksug.com
            </a>
            <a
              href="tel:+256700123456"
              className="flex items-center gap-1.5 transition-colors hover:text-accent-light"
            >
              <Phone className="h-3.5 w-3.5 text-accent" />
              +256 700 123 456
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl transition-shadow duration-300",
          scrolled ? "border-border shadow-card" : "border-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center" aria-label="TrueWorks home">
              <Logo variant="horizontal" width={150} height={38} />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted hover:bg-surface hover:text-primary"
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-4 -bottom-[13px] h-0.5 rounded-full bg-accent transition-all duration-300 lg:-bottom-[17px]",
                      isActive(link.href) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-primary"
                aria-label={`Cart, ${totalItems} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary-dark">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {isLoaded && !isSignedIn && (
                <Link
                  href="/sign-in"
                  className="hidden items-center rounded-lg border border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white sm:inline-flex"
                >
                  Sign in
                </Link>
              )}

              {isLoaded && isSignedIn && (
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Link label="My Account" labelIcon={<User className="h-4 w-4" />} href="/account" />
                    {convexClient && <AdminMenuLink />}
                  </UserButton.MenuItems>
                </UserButton>
              )}

              <Link
                href="/store"
                className="hidden items-center rounded-lg gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-dark shadow-sm transition-all hover:brightness-105 hover:shadow-md sm:inline-flex"
              >
                Browse Store
              </Link>

              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-primary md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && <MobileNav open onClose={() => setMobileOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
