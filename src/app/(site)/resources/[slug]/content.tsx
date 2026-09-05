"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Calendar,
  Download,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  ArrowLeft,
  Share2,
  Tag,
  Clock,
  Copy,
  Check,
  Mail,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MessageCircle,
  ListIcon,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExcelPreview } from "@/components/ui/excel-preview";
import { cn } from "@/lib/utils";

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

interface Resource {
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
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function readingMinutes(text: string) {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

const typeIcons: Record<string, typeof FileText> = {
  document: BookOpen,
  video: Video,
  link: ExternalLink,
  download: Download,
};

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

export default function ResourceDetail({ resource }: { resource: Resource }) {
  const Icon = typeIcons[resource.type] ?? FileText;
  const attachments = resource.attachments ?? [];

  const [copied, setCopied] = useState(false);

  const related = useQuery(
    api.resources.listPublished,
    { category: resource.category },
  );

  const relatedItems = useMemo(
    () =>
      (related ?? [])
        .filter((r) => r._id !== resource._id)
        .slice(0, 4),
    [related, resource._id],
  );

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
    }
  };

  const copyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
  const shareText = encodeURIComponent(resource.title);
  const twitterUrl = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const mailtoUrl = `mailto:?subject=${shareText}&body=${shareUrl}`;

  return (
    <>
      {/* ─── Breadcrumb ──────────────────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-6xl items-center gap-1.5 px-6 py-4 text-sm text-muted-foreground lg:px-8"
        >
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/resources" className="transition-colors hover:text-primary">Resources</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-medium text-foreground">{resource.title}</span>
        </nav>
      </div>

      <div className="bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
          {/* Back / share row */}
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Resources
              </Link>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </FadeIn>

          <div className="grid gap-10 lg:grid-cols-3">
            {/* ─── Main article column ──────────────────────────────── */}
            <div className="lg:col-span-2">
              {/* Hero image */}
              {resource.featuredImage ? (
                <FadeIn>
                  <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-2xl shadow-card">
                    <Image
                      src={resource.featuredImage}
                      alt={resource.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
                    {resource.featured && (
                      <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-dark shadow-md">
                        <Sparkles className="h-2.5 w-2.5" />
                        Featured
                      </span>
                    )}
                  </div>
                </FadeIn>
              ) : (
                <FadeIn>
                  <div className="gradient-brand relative mb-8 flex aspect-[2/1] items-center justify-center overflow-hidden rounded-2xl shadow-card">
                    <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                    <FileText className="relative h-16 w-16 text-accent/60" />
                    {resource.featured && (
                      <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-dark shadow-md">
                        <Sparkles className="h-2.5 w-2.5" />
                        Featured
                      </span>
                    )}
                  </div>
                </FadeIn>
              )}

              {/* Meta badges */}
              <FadeIn delay={0.05}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{resource.category}</Badge>
                  <Badge variant="secondary" className="inline-flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {resource.type}
                  </Badge>
                </div>
              </FadeIn>

              {/* Title */}
              <FadeIn delay={0.1}>
                <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight text-primary sm:text-4xl">
                  {resource.title}
                </h1>
              </FadeIn>

              {/* Date + reading time + downloads */}
              <FadeIn delay={0.15}>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(resource.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {readingMinutes(resource.content)} min read
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Download className="h-4 w-4" />
                    {resource.downloadCount.toLocaleString()} downloads
                  </span>
                </div>
              </FadeIn>

              {/* Article body card */}
              <FadeIn delay={0.2}>
                <article className="mt-8 rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8 lg:p-10">
                  <div className="mb-6 rounded-xl border-l-4 border-accent bg-accent/[0.06] p-5">
                    <p className="text-base leading-relaxed text-foreground">
                      {resource.description}
                    </p>
                  </div>

                  {resource.content && (
                    <div className="prose prose-primary max-w-none">
                      <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                        {resource.content}
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {attachments.length > 0 && (
                    <div className="mt-10 border-t border-border pt-8">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Downloads
                      </h3>
                      <div className="mt-4 space-y-3">
                        {attachments.map((att, i) => {
                          const isExcel = /xlsx|xls|xlsm|xlsb|csv/i.test(att.name);
                          return (
                            <div
                              key={i}
                              className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/40 hover:shadow-sm"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary group-hover:text-accent">
                                <Download className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {att.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(att.size)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isExcel && (
                                  <ExcelPreview url={att.url} fileName={att.name} />
                                )}
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                                >
                                  Download
                                  <ArrowUpRight className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* External URL */}
                  {resource.externalUrl && (
                    <div className="mt-8 border-t border-border pt-8">
                      <a
                        href={resource.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open External Resource
                      </a>
                    </div>
                  )}
                </article>
              </FadeIn>

              {/* Tags */}
              {resource.tags.length > 0 && (
                <FadeIn delay={0.25}>
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </FadeIn>
              )}

              {/* Author / contact strip */}
              <FadeIn delay={0.3}>
                <div className="mt-10 flex flex-col items-stretch gap-4 rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-heading text-sm font-semibold text-primary">
                        Have a question about this resource?
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Our team replies within 24 hours.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md gradient-gold px-5 text-sm font-semibold text-primary-dark shadow-md shadow-accent/20 transition-all hover:brightness-105"
                  >
                    Talk to us
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* ─── Right sidebar ────────────────────────────────────── */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                <FadeIn>
                  <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                    <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <ListIcon className="h-3.5 w-3.5" />
                      </span>
                      At a glance
                    </h3>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Category</dt>
                        <dd className="font-semibold text-foreground">{resource.category}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Type</dt>
                        <dd className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          {resource.type}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Published</dt>
                        <dd className="font-semibold text-foreground">
                          {new Date(resource.createdAt).toLocaleDateString("en-UG", {
                            month: "short",
                            year: "numeric",
                          })}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Read time</dt>
                        <dd className="font-semibold text-foreground">
                          {readingMinutes(resource.content)} min
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Downloads</dt>
                        <dd className="font-semibold text-foreground">
                          {resource.downloadCount.toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </FadeIn>

                <FadeIn delay={0.08}>
                  <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                    <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent-dark">
                        <Share2 className="h-3.5 w-3.5" />
                      </span>
                      Share this
                    </h3>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:scale-[1.02] hover:border-primary/40 hover:bg-white"
                      >
                        <TwitterIcon className="h-3.5 w-3.5" />
                        Twitter
                      </a>
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:scale-[1.02] hover:border-primary/40 hover:bg-white"
                      >
                        <LinkedinIcon className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                      <a
                        href={mailtoUrl}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:scale-[1.02] hover:border-primary/40 hover:bg-white"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </a>
                      <button
                        type="button"
                        onClick={copyLink}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all hover:scale-[1.02]",
                          copied
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-border bg-surface text-foreground hover:border-primary/40 hover:bg-white",
                        )}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </FadeIn>

                {attachments.length > 0 && (
                  <FadeIn delay={0.12}>
                    <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                      <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          <Download className="h-3.5 w-3.5" />
                        </span>
                        Quick download
                      </h3>
                      <ul className="mt-4 space-y-2">
                        {attachments.map((att, i) => (
                          <li key={i}>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5 transition-all hover:border-primary/30 hover:bg-white"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary group-hover:text-accent">
                                <Download className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-foreground">
                                  {att.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatFileSize(att.size)}
                                </p>
                              </div>
                              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeIn>
                )}

                {relatedItems.length > 0 && (
                  <FadeIn delay={0.16}>
                    <div className="rounded-xl border border-border/70 bg-white p-6 shadow-card">
                      <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </span>
                        Related in {resource.category}
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {relatedItems.map((r) => (
                          <li key={r._id}>
                            <Link
                              href={`/resources/${r.slug}`}
                              className="group flex items-start gap-3"
                            >
                              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-accent">
                                {(() => {
                                  const RIcon = typeIcons[r.type] ?? FileText;
                                  return <RIcon className="h-3.5 w-3.5" />;
                                })()}
                              </span>
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                  {r.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  {formatDate(r.createdAt)} · {r.downloadCount.toLocaleString()} downloads
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeIn>
                )}

                <FadeIn delay={0.2}>
                  <div className="gradient-brand relative overflow-hidden rounded-xl p-6 shadow-card">
                    <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                    <div className="relative">
                      <h3 className="font-heading text-base font-semibold text-white">
                        Need a custom build?
                      </h3>
                      <p className="mt-1.5 text-sm text-white/85">
                        We design bespoke business operating systems for
                        organizations of every size.
                      </p>
                      <Link
                        href="/contact"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light transition-transform hover:translate-x-0.5"
                      >
                        Talk to our team
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
