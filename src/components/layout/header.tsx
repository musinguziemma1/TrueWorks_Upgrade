"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, Menu, Mail, Phone, User, LayoutDashboard, Search, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { convexClient } from "@/lib/convex";
import { useCart } from "@/components/layout/cart-context";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth/provider";
import MobileNav from "@/components/layout/mobile-nav";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

function AdminMenuLink() {
  const { isStaff } = useAuth();
  if (!isStaff) return null;
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
    >
      <LayoutDashboard className="h-4 w-4" />
      Admin Dashboard
    </Link>
  );
}

function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/store?q=${encodeURIComponent(q)}` : "/store");
    setOpen(false);
    setQuery("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-primary lg:flex"
        aria-label="Search templates"
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <motion.form
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: "16rem", opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onSubmit={submit}
      className="relative hidden items-center lg:flex"
    >
      <Search className="pointer-events-none absolute left-3 z-10 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search templates..."
        className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-9 text-sm text-foreground outline-none transition-colors focus:border-accent/50 focus:bg-white"
      />
      {query && (
        <button
          type="button"
          onMouseDown={() => {
            setOpen(false);
            setQuery("");
          }}
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-muted-foreground transition-colors hover:bg-surface hover:text-primary"
          aria-label="Close search"
        >
          ✕
        </button>
      )}
    </motion.form>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const settings = useSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
          <p className="tracking-wide">{settings.siteTagline}</p>
          <div className="flex items-center gap-6">
            <a
              href="mailto:info@trueworksgroup.com"
              className="flex items-center gap-1.5 transition-colors hover:text-accent-light"
            >
              <Mail className="h-3.5 w-3.5 text-accent" />
              info@trueworksgroup.com
            </a>
            <a
              href="tel:+256773728944"
              className="flex items-center gap-1.5 transition-colors hover:text-accent-light"
            >
              <Phone className="h-3.5 w-3.5 text-accent" />
              +256 773 728 944
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl transition-all duration-300",
          scrolled ? "border-border/70 shadow-card" : "border-transparent"
        )}
      >
        {/* Top gold accent line */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent via-accent-light to-accent transition-opacity duration-300",
            scrolled ? "opacity-100" : "opacity-70"
          )}
          aria-hidden
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "flex items-center justify-between transition-all duration-300",
              scrolled ? "h-16" : "h-16 lg:h-[72px]"
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center" aria-label="TrueWorks home">
              <Logo variant="horizontal" width={scrolled ? 140 : 150} height={scrolled ? 36 : 38} />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-lg bg-gradient-to-b from-accent/15 to-accent/5 ring-1 ring-accent/20"
                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                    <span className="relative">{link.label}</span>
                    {!active && (
                      <span className="absolute inset-x-4 -bottom-[2px] h-0.5 origin-left scale-x-0 rounded-full bg-accent transition-transform duration-300 group-hover:scale-x-100" />
                    )}
                    {active && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute inset-x-4 -bottom-[2px] h-0.5 rounded-full bg-accent"
                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <SearchBar />

              <Link
                href="/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-surface hover:text-primary hover:ring-1 hover:ring-accent/30"
                aria-label={`Cart, ${totalItems} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full gradient-gold px-1 text-[10px] font-bold text-primary-dark shadow-sm">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {!loading && !isAuthenticated && (
                <Link
                  href="/sign-in"
                  className="hidden items-center rounded-lg border border-primary/15 px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:border-accent/40 hover:bg-surface sm:inline-flex"
                >
                  Sign in
                </Link>
              )}

              {!loading && isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-surface">
                        <User className="h-5 w-5" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
                        {(user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user?.name ?? "User"}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      render={
                        <Link href="/account" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          My Account
                        </Link>
                      }
                    />
                    {convexClient && <AdminMenuLink />}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onClick={logout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Link
                href="/store"
                className="group hidden items-center gap-1.5 rounded-lg gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-dark shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-accent/40 hover:ring-offset-2 hover:ring-offset-white hover:brightness-105 sm:inline-flex"
              >
                Browse Store
              </Link>

              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-primary md:hidden"
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
