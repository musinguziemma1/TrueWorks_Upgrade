"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, ArrowRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { convexClient } from "@/lib/convex";
import { Logo } from "@/components/logo";
import { SocialIcon, socialLinks } from "@/components/layout/social-icons";
import { useAuth } from "@/lib/auth/provider";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

function AdminDashboardLink({ onClose }: { onClose: () => void }) {
  const { isStaff } = useAuth();
  if (!isStaff) return null;
  return (
    <Link
      href="/admin"
      onClick={onClose}
      className="flex items-center justify-center rounded-lg border border-primary/20 px-5 py-3 text-sm font-semibold text-primary"
    >
      Admin Dashboard
    </Link>
  );
}

interface MobileNavProps {
  open?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export function MobileNav({ open: externalOpen, onClose, onToggle }: MobileNavProps) {
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? externalOpen : internalOpen;
  const close = () => {
    if (isControlled) onClose?.();
    else setInternalOpen(false);
  };
  const toggle = () => {
    if (isControlled) onToggle?.();
    else setInternalOpen((prev) => !prev);
  };

  if (!isControlled) {
    return (
      <>
        <button
          onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <AnimatePresence>{isOpen && <MobileNavPanel onClose={close} />}</AnimatePresence>
      </>
    );
  }

  return <AnimatePresence>{isOpen && <MobileNavPanel onClose={close} />}</AnimatePresence>;
}

function MobileNavPanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div className="absolute inset-0 bg-primary-dark/50 backdrop-blur-sm" onClick={onClose} />
      <motion.nav
        className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-elevated"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <Link href="/" onClick={onClose} aria-label="TrueWorks home">
            <Logo variant="horizontal" width={140} height={34} />
          </Link>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-1">
            {navLinks.map((link, i) => (
              <li key={link.href}>
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.3, ease: "easeOut" }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center justify-between overflow-hidden rounded-lg px-4 py-3 text-base font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-gradient-to-r from-accent/15 to-accent/5 text-primary ring-1 ring-accent/20"
                        : "text-foreground/75 hover:bg-surface hover:text-primary"
                    )}
                  >
                    <span className="relative flex items-center gap-3">
                      {isActive(link.href) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                      {link.label}
                    </span>
                    {!isActive(link.href) && (
                      <ArrowRight className="h-4 w-4 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                    )}
                  </Link>
                </motion.div>
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
          className="space-y-3 px-5 pb-5"
        >
          <Link
            href="/store"
            onClick={onClose}
            className="group flex items-center justify-center gap-2 rounded-lg gradient-gold px-5 py-3 text-sm font-semibold text-primary-dark transition-all hover:brightness-105"
          >
            Browse Store
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border border-primary/20 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Talk to Our Team
          </Link>

          {!loading && (
            <div className="space-y-2 border-t border-border pt-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/sign-in"
                    onClick={onClose}
                    className="flex items-center justify-center rounded-lg border border-primary/20 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={onClose}
                    className="flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
                  >
                    Create account
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="flex items-center justify-center rounded-lg border border-primary/20 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    My Account
                  </Link>
                  {convexClient && <AdminDashboardLink onClose={onClose} />}
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface/80"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>

        <div className="border-t border-border px-5 pb-8 pt-5">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted">
            Connect with us
          </p>
          <div className="flex items-center justify-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-muted transition-all hover:bg-primary hover:text-white"
                aria-label={social.name}
              >
                <SocialIcon iconKey={social.key} />
              </a>
            ))}
          </div>
        </div>
      </motion.nav>
    </motion.div>
  );
}

export default MobileNav;
