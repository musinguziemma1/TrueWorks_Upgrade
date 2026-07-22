"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { SocialIcon, socialLinks } from "@/components/layout/social-icons";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

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
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-surface text-primary"
                      : "text-foreground/75 hover:bg-surface hover:text-primary"
                  )}
                >
                  {link.label}
                  {isActive(link.href) && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 px-5 pb-5">
          <Link
            href="/store"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-lg gradient-gold px-5 py-3 text-sm font-semibold text-primary-dark transition-all hover:brightness-105"
          >
            Browse Store
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border border-primary/20 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Talk to Our Team
          </Link>
        </div>

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
