"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Clock, Calendar, ArrowRight, ChevronRight, FileText, CheckCircle2, Download, ExternalLink, BookOpen, Video } from "lucide-react";
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

export default function ResourcesContent() {
  if (!convexClient) return null;
  return <ResourcesContentInner />;
}

function ResourcesContentInner() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const allResources = useQuery(api.resources.listPublished, {});

  const isLoading = allResources === undefined;
  const resources: Array<{
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
    attachments?: { name: string; url: string; size: number }[];    externalUrl?: string;
    tags: string[];
    downloadCount: number;
    createdAt: number;
    updatedAt: number;
  }> = allResources ?? [];

  const categories = useMemo(() => {
    const cats = new Set(resources.map((r) => r.category));
    return ["All", ...Array.from(cats)];
  }, [resources]);

  const sidebarCategories = useMemo(() => {
    const counts = new Map<string, number>();
    resources.forEach((r) => {
      counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [resources]);

  const featuredResource = useMemo(
    () => resources.find((r) => r.featured) ?? resources[0],
    [resources]
  );

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesCategory = activeCategory === "All" || r.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && r._id !== featuredResource?._id;
    });
  }, [resources, activeCategory, searchQuery, featuredResource]);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) setSubscribed(true);
  };

  return (
    <>
      {/* Hero */}
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent/[0.08] blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
              Resources
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="mt-4 font-heading text-4xl font-semibold text-white sm:text-5xl">
              The Knowledge Hub
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70 sm:text-lg">
              Insights, guides and practical resources to help you build a
              better organization.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Search + filters */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full border-border bg-surface pl-11 focus:bg-white"
              aria-label="Search resources"
            />
          </div>
          <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  activeCategory === cat
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border bg-white text-muted hover:border-primary/40 hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-surface py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  {/* Featured */}
                  {activeCategory === "All" && !searchQuery && featuredResource && (
                    <FadeIn>
                      <Link href={`/resources/${featuredResource.slug}`} className="block">
                        <article className="group cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-white shadow-card transition-shadow duration-300 hover:shadow-elevated">
                          {featuredResource.featuredImage ? (
                            <div className="relative aspect-[2/1] overflow-hidden">
                              <Image
                                src={featuredResource.featuredImage}
                                alt={featuredResource.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 66vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <span className="absolute left-5 top-5 rounded-full gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-dark">
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-accent-dark">
                                {featuredResource.category}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {featuredResource.type}
                              </Badge>
                            </div>
                            <h2 className="mt-2 font-heading text-xl font-semibold leading-snug text-primary transition-colors group-hover:text-accent-dark sm:text-2xl">
                              {featuredResource.title}
                            </h2>
                            <p className="mt-3 leading-relaxed text-muted">{featuredResource.description}</p>
                            {(featuredResource.attachments ?? []).length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {(featuredResource.attachments ?? []).map((att, i) => (
                                  <span
                                    key={i}
                                    role="link"
                                    tabIndex={0}
                                    className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      window.open(att.url, "_blank", "noopener,noreferrer");
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        window.open(att.url, "_blank", "noopener,noreferrer");
                                      }
                                    }}
                                  >
                                    <Download className="h-3 w-3" />
                                    {att.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(featuredResource.createdAt)}
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    </FadeIn>
                  )}

                  {/* Resource grid */}
                  {filteredResources.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {filteredResources.map((resource, i) => {
                        const Icon = typeIcons[resource.type] ?? FileText;
                        return (
                          <FadeIn key={resource._id} delay={i * 0.05}>
                            <Link href={`/resources/${resource.slug}`} className="block">
                              <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                                {resource.featuredImage ? (
                                  <div className="relative aspect-video overflow-hidden">
                                    <Image
                                      src={resource.featuredImage}
                                      alt={resource.title}
                                      fill
                                      sizes="(max-width: 640px) 100vw, 33vw"
                                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex aspect-video items-center justify-center bg-surface">
                                    <Icon className="h-9 w-9 text-primary/20 transition-colors group-hover:text-accent/50" />
                                  </div>
                                )}
                                <div className="flex flex-1 flex-col p-5">
                                  <div className="flex items-center gap-2">
                                    <span className="self-start text-[11px] font-semibold uppercase tracking-wider text-accent-dark">
                                      {resource.category}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {resource.type}
                                    </Badge>
                                  </div>
                                  <h3 className="mt-2 font-heading text-base font-semibold leading-snug text-primary transition-colors group-hover:text-accent-dark">
                                    {resource.title}
                                  </h3>
                                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                                    {resource.description}
                                  </p>
                                  {(resource.attachments ?? []).length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {(resource.attachments ?? []).slice(0, 2).map((att, j) => (
                                        <span
                                          key={j}
                                          className="flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-[10px] font-medium text-muted"
                                        >
                                          <Download className="h-2.5 w-2.5" />
                                          {att.name}
                                        </span>
                                      ))}
                                      {(resource.attachments ?? []).length > 2 && (
                                        <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
                                          +{(resource.attachments ?? []).length - 2} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-3.5 text-xs text-muted">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(resource.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </article>
                            </Link>
                          </FadeIn>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
                        <Search className="h-6 w-6 text-muted" />
                      </span>
                      <p className="mt-4 font-heading text-lg font-semibold text-primary">
                        No resources found
                      </p>
                      <p className="mt-1 text-sm text-muted">
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

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <FadeIn>
                  <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                    <h3 className="font-heading text-base font-semibold text-primary">Categories</h3>
                    <ul className="mt-4 space-y-1">
                      {sidebarCategories.map((cat) => (
                        <li key={cat.name}>
                          <button
                            onClick={() => setActiveCategory(cat.name)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                              activeCategory === cat.name
                                ? "bg-primary/[0.06] font-semibold text-primary"
                                : "text-muted hover:bg-surface hover:text-primary"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <ChevronRight className="h-3.5 w-3.5" />
                              {cat.name}
                            </span>
                            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                              {cat.count}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                  <div className="gradient-brand relative overflow-hidden rounded-xl p-6 shadow-card">
                    <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                    <div className="relative">
                      <h3 className="font-heading text-lg font-semibold text-white">
                        The TrueWorks Brief
                      </h3>
                      <p className="mt-1.5 text-sm text-white/60">
                        Practical insights for better organizations - once a month,
                        no spam.
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
                            className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.08] px-3.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-accent/60 focus:bg-white/[0.12]"
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

                <FadeIn delay={0.15}>
                  <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                    <h3 className="font-heading text-base font-semibold text-primary">
                      Popular Topics
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sidebarCategories.slice(0, 5).map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => setActiveCategory(cat.name)}
                          className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition-all hover:border-primary/40 hover:text-primary"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
