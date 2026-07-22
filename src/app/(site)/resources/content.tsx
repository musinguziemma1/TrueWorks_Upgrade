"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Clock, Calendar, ArrowRight, ChevronRight, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categories = ["All", "Financial Modeling", "KPI Dashboards", "Business Plans", "Strategy", "Operations"];

const featuredArticle = {
  category: "KPI Dashboards",
  title: "How to Build a Hospital KPI Dashboard That Drives Better Patient Outcomes",
  excerpt:
    "Learn how healthcare administrators can design and implement effective KPI dashboards that improve operational efficiency, patient care, and regulatory compliance.",
  readingTime: "8 min read",
  date: "Jun 15, 2026",
  author: "Grace Nakato",
};

const articles = [
  { category: "Financial Modeling", title: "Financial Modeling Best Practices for East African SMEs", excerpt: "A practical guide to building financial models that help small and medium enterprises secure funding and plan for growth.", readingTime: "6 min read", date: "Jun 10, 2026", author: "Samuel Mukasa" },
  { category: "Business Plans", title: "The Modern Business Plan: What Investors Actually Want to See", excerpt: "Discover how to craft a compelling business plan that resonates with today's investors and stakeholders.", readingTime: "5 min read", date: "Jun 5, 2026", author: "Faith Nansubuga" },
  { category: "Strategy", title: "Strategic Planning for Nonprofits: A Template-Driven Approach", excerpt: "How nonprofit organizations can use strategic planning templates to align teams, measure impact, and drive mission success.", readingTime: "7 min read", date: "May 28, 2026", author: "Daniel Okello" },
  { category: "Operations", title: "Streamlining NGO Operations with Standard Operating Procedures", excerpt: "A step-by-step guide to creating SOPs that improve efficiency, accountability, and scalability in non-profit organizations.", readingTime: "5 min read", date: "May 20, 2026", author: "Grace Nakato" },
  { category: "Financial Modeling", title: "Cash Flow Forecasting: A Guide for Growing Businesses", excerpt: "Master the art of cash flow forecasting to make informed decisions and keep your business financially healthy.", readingTime: "6 min read", date: "May 14, 2026", author: "Samuel Mukasa" },
  { category: "KPI Dashboards", title: "Sales KPI Dashboards: Tracking What Matters Most", excerpt: "Learn which sales metrics to track and how to build a dashboard that gives your team real-time visibility into performance.", readingTime: "4 min read", date: "May 8, 2026", author: "Faith Nansubuga" },
];

const sidebarCategories = [
  { name: "Financial Modeling", count: 12 },
  { name: "KPI Dashboards", count: 9 },
  { name: "Business Plans", count: 7 },
  { name: "Strategy", count: 6 },
  { name: "Operations", count: 5 },
];

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

export default function ResourcesContent() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const filteredArticles = articles.filter((a) => {
    const matchesCategory = activeCategory === "All" || a.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full border-border bg-surface pl-11 focus:bg-white"
              aria-label="Search articles"
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
              {/* Featured */}
              {activeCategory === "All" && !searchQuery && (
                <FadeIn>
                  <article className="group cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-white shadow-card transition-shadow duration-300 hover:shadow-elevated">
                    <div className="gradient-brand relative flex aspect-[2/1] items-center justify-center">
                      <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                      <FileText className="relative h-14 w-14 text-accent/60" />
                      <span className="absolute left-5 top-5 rounded-full gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-dark">
                        Featured
                      </span>
                    </div>
                    <div className="p-6 sm:p-8">
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent-dark">
                        {featuredArticle.category}
                      </span>
                      <h2 className="mt-2 font-heading text-xl font-semibold leading-snug text-primary transition-colors group-hover:text-accent-dark sm:text-2xl">
                        {featuredArticle.title}
                      </h2>
                      <p className="mt-3 leading-relaxed text-muted">{featuredArticle.excerpt}</p>
                      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {featuredArticle.readingTime}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {featuredArticle.date}
                        </span>
                        <span className="font-medium text-foreground">{featuredArticle.author}</span>
                      </div>
                    </div>
                  </article>
                </FadeIn>
              )}

              {/* Article grid */}
              {filteredArticles.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredArticles.map((article, i) => (
                    <FadeIn key={article.title} delay={i * 0.05}>
                      <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                        <div className="flex aspect-video items-center justify-center bg-surface">
                          <FileText className="h-9 w-9 text-primary/20 transition-colors group-hover:text-accent/50" />
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <span className="self-start text-[11px] font-semibold uppercase tracking-wider text-accent-dark">
                            {article.category}
                          </span>
                          <h3 className="mt-2 font-heading text-base font-semibold leading-snug text-primary transition-colors group-hover:text-accent-dark">
                            {article.title}
                          </h3>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                            {article.excerpt}
                          </p>
                          <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-3.5 text-xs text-muted">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {article.readingTime}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {article.date}
                            </span>
                          </div>
                        </div>
                      </article>
                    </FadeIn>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
                    <Search className="h-6 w-6 text-muted" />
                  </span>
                  <p className="mt-4 font-heading text-lg font-semibold text-primary">
                    No articles found
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
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
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
                      Practical insights for better organizations — once a month,
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
                    {["Financial Modeling", "KPI Dashboards", "Business Plans", "Strategy", "Operations"].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setActiveCategory(topic)}
                        className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition-all hover:border-primary/40 hover:text-primary"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
