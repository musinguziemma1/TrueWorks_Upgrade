"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/provider";
import { HOMEPAGE_NAV, NAV_SECTION_TARGETS } from "./data";
import { EASE_OUT } from "./motion";

/* -------------------------------------------------------------------------- *
 * Homepage navigation
 *
 * A section-level navigation rail that lives inside the next-generation
 * homepage. It docks beneath the global site header (sticky, top-16) and
 * transitions from transparent-over-hero to a glass surface once the page
 * scrolls. Mobile uses an animated drawer.
 * -------------------------------------------------------------------------- */

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = NAV_SECTION_TARGETS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.2, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return active;
}

function useScrollState() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrolled;
}
export default function NextGenNav() {
  const scrolled = useScrollState();
  const activeSection = useActiveSection();
  const { isAuthenticated } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      <div className="sticky top-16 z-40 w-full">
        <nav
          aria-label="Homepage sections"
          className={cn(
            "border-b transition-all duration-500",
            scrolled
              ? "border-white/10 bg-[#04101F]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#04101F]/70"
              : "border-transparent bg-transparent"
          )}
        >
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <ul className="hidden items-center gap-1 md:flex">
              {HOMEPAGE_NAV.map((item) => {
                const target = item.href.startsWith("#") ? item.href.slice(1) : null;
                const isActive = target !== null && target === activeSection;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "relative flex items-center rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors",
                        isActive ? "text-white" : "text-white/60 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nextgen-nav-active"
                          className="absolute inset-0 rounded-lg bg-white/[0.08] ring-1 ring-white/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                      <span className="relative">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex w-full items-center justify-between gap-3 md:w-auto">
              <Link
                href="/"
                className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50 transition-colors hover:text-white md:hidden"
              >
                TrueWorks
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href="/store"
                  aria-label="Search the systems library"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <Search className="h-4 w-4" />
                </Link>

                {!isAuthenticated && (
                  <Link
                    href="/sign-in"
                    className="hidden items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-[13px] font-semibold text-white/85 transition-colors hover:border-white/30 hover:text-white sm:inline-flex"
                  >
                    <User className="h-3.5 w-3.5" />
                    Sign In
                  </Link>
                )}

                <Link
                  href="/store"
                  className="group hidden items-center gap-2 rounded-lg bg-gradient-to-br from-accent-light to-accent-dark px-4 py-2 text-[13px] font-semibold text-[#071A33] shadow-[0_10px_30px_-12px_rgba(218,165,32,0.7)] transition-all hover:brightness-105 sm:inline-flex"
                >
                  Browse Systems
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open section menu"
                  aria-expanded={drawerOpen}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-[70] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="Homepage sections"
          >
            <button
              type="button"
              aria-label="Close section menu"
              className="absolute inset-0 bg-[#04101F]/80 backdrop-blur-sm"
              onClick={closeDrawer}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col border-l border-white/10 bg-[#071A33] px-6 py-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
                  Sections
                </span>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close section menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ul className="mt-8 space-y-1">
                {HOMEPAGE_NAV.map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * index + 0.1, duration: 0.35, ease: EASE_OUT }}
                  >
                    <Link
                      href={item.href}
                      onClick={closeDrawer}
                      className="flex items-center justify-between rounded-xl px-3 py-3.5 font-heading text-lg font-semibold text-white/90 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      {item.label}
                      <ArrowRight className="h-4 w-4 text-accent" />
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-auto space-y-3 pt-8">
                <Link
                  href="/store"
                  onClick={closeDrawer}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent-light to-accent-dark px-5 py-3.5 text-sm font-semibold text-[#071A33]"
                >
                  Browse Systems
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    href="/sign-in"
                    onClick={closeDrawer}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:border-white/30"
                  >
                    <User className="h-4 w-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}