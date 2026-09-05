"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useDeferredValue } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Calendar,
  ArrowRight,
  ChevronRight,
  FileText,
  CheckCircle2,
  Download,
  ExternalLink,
  BookOpen,
  Video,
  Clock,
  Mail,
  Sparkles,
  TrendingUp,
  X,
  ArrowUpRight,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { convexClient } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" });
}

function readingMinutes(text: string) {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const typeIcons: Record<string, typeof FileText> = {
  document: BookOpen,
  video: Video,
  link: ExternalLink,
  download: Download,
};

const typeAccent: Record<string, string> = {
  document: "from-blue-500/15 to-blue-500/0 text-blue-600 dark:text-blue-400",
  video: "from-rose-500/15 to-rose-500/0 text-rose-600 dark:text-rose-400",
  link: "from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-400",
  download: "from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-400",
};

export default function ResourcesContent() {
  if (!convexClient) return null;
  return <ResourcesContentInner />;
}

type Resource = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  type: string;
  status: string;
  featured: boolean;
  featuredImage?: string;
  attachments?: { name: string; url: string; size: number }[];
  externalUrl?: string;
  tags: string[];
  downloadCount: number;
  createdAt: number;
  updatedAt: number;
};

function ResourcesContentInner() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const allResources = useQuery(api.resources.listPublished, {});

  const isLoading = allResources === undefined;
  const resources = useMemo<Resource[]>(() => allResources ?? [], [allResources]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    resources.forEach((r) => counts.set(r.category, (counts.get(r.category) ?? 0) + 1));
    const cats = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
    return [{ name: "All", count: resources.length }, ...cats];
  }, [resources]);

  const featuredResource = useMemo(
    () => resources.find((r) => r.featured) ?? resources[0],
    [resources]
  );

  const popularResources = useMemo(
    () =>
      [...resources]
        .filter((r) => r._id !== featuredResource?._id)
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 4),
    [resources, featuredResource]
  );

  const filteredResources = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return resources.filter((r) => {
      const matchesCategory = activeCategory === "All" || r.category === activeCategory;
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch && r._id !== featuredResource?._id;
    });
  }, [resources, activeCategory, deferredQuery, featuredResource]);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) setSubscribed(true);
  };

  const totalCategories = categories.length - 1;
  const totalDownloads = resources.reduce((sum, r) => sum + r.downloadCount, 0);

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent/[0.10] blur-3xl" aria-hidden />
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-accent/[0.06] blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-light backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  Knowledge Hub
                </div>
              </FadeIn>
              <FadeIn delay={0.08}>
                <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                  The <span className="text-gradient-gold">Knowledge Hub</span> for better organizations.
                </h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                  Insights, guides and practical resources to help you build
                  systems that actually work.
                </p>
              </FadeIn>
              <FadeIn delay={0.24}>
                <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
                  {[
                    "Practical, not theoretical",
                    "Updated monthly",
                    "Free to read",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent-light" />
                      {t}
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
            <FadeIn delay={0.2} className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { v: resources.length, l: "Resources" },
                  { v: totalCategories, l: "Categories" },
                  { v: totalDownloads.toLocaleString(), l: "Downloads" },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur"
                  >
                    <p className="font-heading text-3xl font-semibold text-white">
                      {m.v}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                      {m.l}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Search + filter bar ───────────────────────────────────────── */}
      <section className="sticky top-16 z-30 -mt-1 border-b border-border bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search resources, tags, topics…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full border-border bg-white pl-11 pr-10 shadow-sm focus:bg-white"
                aria-label="Search resources"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground sm:shrink-0">
              <span className="hidden sm:inline">
                {filteredResources.length} {filteredResources.length === 1 ? "result" : "results"}
              </span>
            </div>
          </div>
          <div className="scrollbar-hide mt-3 -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
            {categories.map((cat) => {
              const active = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                    active
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {cat.name}
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      active ? "bg-white/20 text-white" : "bg-surface text-muted-foreground"
                    )}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Main content ──────────────────────────────────────────────── */}
      <section className="bg-surface py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  {/* Featured */}
                  {activeCategory === "All" && !deferredQuery && featuredResource && (
                    <FadeIn>
                      <Link href={`/resources/${featuredResource.slug}`} className="group block">
                        <article className="relative cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
                          {featuredResource.featuredImage ? (
                            <div className="relative aspect-[2/1] overflow-hidden">
                              <Image
                                src={featuredResource.featuredImage}
                                alt={featuredResource.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 66vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" aria-hidden />
                              <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-dark shadow-md">
                                <Sparkles className="h-2.5 w-2.5" />
                                Featured
                              </span>
                            </div>
                          ) : (
                            <div className="gradient-brand relative flex aspect-[2/1] items-center justify-center">
                              <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                              <FileText className="relative h-14 w-14 text-accent/60" />
                              <span className="absolute left-5 top-5 rounded-full gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-dark">
                                Featured
                              </span>
                            </div>
                          )}
                          <div className="p-6 sm:p-8">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-accent-dark">
                                {featuredResource.category}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {featuredResource.type}
                              </Badge>
                              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {readingMinutes(featuredResource.content)} min read
                              </span>
                            </div>
                            <h2 className="mt-3 font-heading text-2xl font-semibold leading-snug text-primary transition-colors group-hover:text-accent-dark sm:text-3xl">
                              {featuredResource.title}
                            </h2>
                            <p className="mt-3 leading-relaxed text-muted-foreground">
                              {featuredResource.description}
                            </p>
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(featuredResource.createdAt)}
                              </span>
                              <span className="inline-flex items-center gap-1 font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                                Read article
                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    </FadeIn>
                  )}

                  {/* Resource grid */}
                  {filteredResources.length > 0 ? (
                    <div>
                      <div className="mb-5 flex items-end justify-between">
                        <h2 className="font-heading text-lg font-semibold text-primary">
                          {activeCategory === "All" ? "Latest resources" : activeCategory}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                          {filteredResources.length} {filteredResources.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        {filteredResources.map((resource, i) => {
                          const Icon = typeIcons[resource.type] ?? FileText;
                          const accent = typeAccent[resource.type] ?? typeAccent.document;
                          return (
                            <FadeIn key={resource._id} delay={i * 0.04}>
                              <Link href={`/resources/${resource.slug}`} className="group block h-full">
                                <article className="flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-elevated">
                                  {resource.featuredImage ? (
                                    <div className="relative aspect-[16/10] overflow-hidden">
                                      <Image
                                        src={resource.featuredImage}
                                        alt={resource.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                      />
                                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
                                        <Icon className="h-3 w-3" />
                                        {resource.type}
                                      </span>
                                    </div>
                                  ) : (
                                    <div
                                      className={cn(
                                        "relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br",
                                        accent,
                                      )}
                                    >
                                      <Icon className="h-10 w-10 opacity-70" />
                                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
                                        <Icon className="h-3 w-3" />
                                        {resource.type}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex flex-1 flex-col p-5">
                                    <span className="self-start text-[11px] font-semibold uppercase tracking-wider text-accent-dark">
                                      {resource.category}
                                    </span>
                                    <h3 className="mt-2 font-heading text-base font-semibold leading-snug text-primary transition-colors group-hover:text-accent-dark">
                                      {resource.title}
                                    </h3>
                                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                                      {resource.description}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(resource.createdAt)}
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        {readingMinutes(resource.content)} min
                                      </span>
                                    </div>
                                  </div>
                                </article>
                              </Link>
                            </FadeIn>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
                        <Search className="h-6 w-6 text-muted-foreground" />
                      </span>
                      <p className="mt-4 font-heading text-lg font-semibold text-primary">
                        No resources found
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting your search or choosing another category.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-6"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveCategory("All");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ─── Sidebar ─────────────────────────────────────────────── */}
            <aside className="hidden lg:block">
              <div className="sticky top-32 space-y-5">
                <FadeIn>
                  <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                    <h3 className="flex items-center gap-2 font-heading text-base font-semibold text-primary">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      Categories
                    </h3>
                    <ul className="mt-4 space-y-1">
                      {categories.map((cat) => (
                        <li key={cat.name}>
                          <button
                            onClick={() => setActiveCategory(cat.name)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                              activeCategory === cat.name
                                ? "bg-primary/[0.06] font-semibold text-primary"
                                : "text-muted-foreground hover:bg-surface hover:text-primary"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <ChevronRight
                                className={cn(
                                  "h-3.5 w-3.5 transition-transform",
                                  activeCategory === cat.name && "translate-x-0.5 text-primary",
                                )}
                              />
                              {cat.name}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                activeCategory === cat.name
                                  ? "bg-primary text-white"
                                  : "bg-surface text-muted-foreground",
                              )}
                            >
                              {cat.count}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>

                {popularResources.length > 0 && (
                  <FadeIn delay={0.08}>
                    <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                      <h3 className="flex items-center gap-2 font-heading text-base font-semibold text-primary">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent-dark">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </span>
                        Most downloaded
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {popularResources.map((r, i) => (
                          <li key={r._id}>
                            <Link
                              href={`/resources/${r.slug}`}
                              className="group flex items-start gap-3"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface font-heading text-[11px] font-bold text-accent-dark">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                                  {r.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  {r.downloadCount.toLocaleString()} downloads
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeIn>
                )}

                <FadeIn delay={0.12}>
                  <div className="gradient-brand relative overflow-hidden rounded-xl p-6 shadow-card">
                    <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-light">
                        Monthly
                      </span>
                      <h3 className="mt-3 font-heading text-lg font-semibold text-white">
                        The TrueWorks Brief
                      </h3>
                      <p className="mt-1.5 text-sm text-white/85">
                        Practical insights for better organizations — once a
                        month, no spam.
                      </p>
                      {subscribed ? (
                        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-accent-light">
                          <CheckCircle2 className="h-4 w-4" />
                          You&apos;re subscribed. Welcome aboard.
                        </p>
                      ) : (
                        <form onSubmit={subscribe} className="mt-4 space-y-2.5">
                          <label htmlFor="resources-newsletter" className="sr-only">
                            Email address
                          </label>
                          <input
                            id="resources-newsletter"
                            type="email"
                            required
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            placeholder="Your email address"
                            className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.08] px-3.5 text-sm text-white placeholder:text-white/70 outline-none transition-colors focus:border-accent/60 focus:bg-white/[0.12]"
                          />
                          <button
                            type="submit"
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg gradient-gold text-sm font-semibold text-primary-dark transition-all hover:brightness-105"
                          >
                            Subscribe
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.16}>
                  <Link
                    href="/contact"
                    className="group block rounded-xl border border-border/70 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-elevated"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary group-hover:text-accent">
                      <Mail className="h-4 w-4" />
                    </span>
                    <h3 className="mt-3 font-heading text-base font-semibold text-primary">
                      Can&apos;t find what you need?
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tell us what you&apos;re working on and we&apos;ll point
                      you to the right resource.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-dark transition-transform group-hover:translate-x-0.5">
                      Talk to us
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </Link>
                </FadeIn>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
