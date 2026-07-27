"use client";

import Image from "next/image";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExcelPreview } from "@/components/ui/excel-preview";

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: resource.title,
        text: resource.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-white">
        <nav aria-label="Breadcrumb" className="mx-auto flex max-w-4xl items-center gap-1.5 px-6 py-4 text-sm text-muted lg:px-8">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/resources" className="transition-colors hover:text-primary">Resources</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-medium text-foreground">{resource.title}</span>
        </nav>
      </div>

      <div className="bg-surface">
        <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8 lg:py-14">
          {/* Back + Share */}
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/resources"
                className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
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

          {/* Hero image */}
          {resource.featuredImage && (
            <FadeIn delay={0.05}>
              <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-2xl">
                <Image
                  src={resource.featuredImage}
                  alt={resource.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                  priority
                />
              </div>
            </FadeIn>
          )}

          {/* Meta badges */}
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{resource.category}</Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {resource.type}
              </Badge>
              {resource.featured && (
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Featured</Badge>
              )}
            </div>
          </FadeIn>

          {/* Title */}
          <FadeIn delay={0.15}>
            <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight text-primary sm:text-4xl">
              {resource.title}
            </h1>
          </FadeIn>

          {/* Date + Downloads */}
          <FadeIn delay={0.2}>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(resource.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4" />
                {resource.downloadCount.toLocaleString()} downloads
              </span>
            </div>
          </FadeIn>

          {/* Content card */}
          <FadeIn delay={0.25}>
            <div className="mt-8 rounded-2xl border border-border/70 bg-white p-6 shadow-card sm:p-8 lg:p-10">
              {/* Description */}
              <div className="mb-6 rounded-xl bg-surface p-5">
                <p className="text-base leading-relaxed text-foreground">{resource.description}</p>
              </div>

              {/* Full content */}
              {resource.content && (
                <div className="prose prose-primary max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{resource.content}</div>
                </div>
              )}

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Attachments
                  </h3>
                  <div className="mt-4 space-y-3">
                    {attachments.map((att, i) => {
                      const isExcel = /xlsx|xls|xlsm|xlsb|csv/i.test(att.name);
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
                            <Download className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{att.name}</p>
                            <p className="text-xs text-muted">{formatFileSize(att.size)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isExcel && (
                              <ExcelPreview url={att.url} fileName={att.name} />
                            )}
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90"
                            >
                              Download
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
                <div className="mt-8">
                  <a
                    href={resource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open External Link
                  </a>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Tags */}
          {resource.tags.length > 0 && (
            <FadeIn delay={0.3}>
              <div className="mt-6 flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted" />
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </>
  );
}
