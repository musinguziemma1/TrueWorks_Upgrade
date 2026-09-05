"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Send,
  Headphones,
  ShoppingBag,
  FileDown,
  Handshake,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Check,
  MessageCircle,
  Loader2,
  Sparkles,
  Shield,
  Globe,
  Users,
  Star,
  Quote,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    detail: "info@trueworksgroup.com",
    sub: "Replies within 24 hours",
    href: "mailto:info@trueworksgroup.com",
    accent: "from-blue-500/15 to-blue-500/5",
    iconColor: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
  },
  {
    icon: Phone,
    title: "Phone",
    detail: "+256 773 728 944",
    sub: "Mon – Fri · 8:00 – 17:00 EAT",
    href: "tel:+256773728944",
    accent: "from-emerald-500/15 to-emerald-500/5",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    detail: "+256 773 728 944",
    sub: "Chat with us directly",
    href: "https://wa.me/256773728944",
    accent: "from-green-500/15 to-green-500/5",
    iconColor: "text-green-600 dark:text-green-400",
    ring: "ring-green-500/20",
  },
  {
    icon: Clock,
    title: "Business hours",
    detail: "Mon – Fri · 8:00 – 17:00",
    sub: "Sat · 9:00 – 13:00 EAT",
    href: undefined,
    accent: "from-amber-500/15 to-amber-500/5",
    iconColor: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
  },
];

const supportCards = [
  {
    icon: Headphones,
    title: "Technical support",
    description: "Stuck on a template or dashboard? Our engineers jump in to get you moving again.",
    linkText: "Get support",
    subject: "Technical Support",
    accent: "from-primary/10 to-primary/0",
  },
  {
    icon: ShoppingBag,
    title: "Sales inquiries",
    description: "Need a quote, bulk pricing or a tailored package? Talk to our sales team.",
    linkText: "Contact sales",
    subject: "Sales",
    accent: "from-accent/15 to-accent/0",
  },
  {
    icon: FileDown,
    title: "Template requests",
    description: "Looking for something we don't have? We build bespoke systems for clients.",
    linkText: "Request template",
    subject: "Template Request",
    accent: "from-emerald-500/10 to-emerald-500/0",
  },
  {
    icon: Handshake,
    title: "Partnerships",
    description: "Interested in co-marketing, reselling or joint ventures? Let's explore fit.",
    linkText: "Explore partnerships",
    subject: "Partnership",
    accent: "from-rose-500/10 to-rose-500/0",
  },
];

const trustStats = [
  { icon: Users, value: "1,200+", label: "Clients served" },
  { icon: Globe, value: "30+", label: "Countries reached" },
  { icon: Star, value: "4.9 / 5", label: "Average rating" },
  { icon: Shield, value: "100%", label: "Secure & verified" },
];

const faqItems = [
  {
    q: "How quickly will I hear back after submitting the form?",
    a: "Most inquiries get a personal response within 4 business hours during Kampala office hours, and always within 24 hours.",
  },
  {
    q: "Do you offer custom-built templates and business systems?",
    a: "Yes. We design tailored operating systems for organisations across East Africa and beyond. Tell us about your workflow and we'll scope a solution.",
  },
  {
    q: "Can I request a refund or exchange?",
    a: "Digital products come with a 14-day satisfaction guarantee. If a template isn't the right fit, reach out via the form and we'll make it right.",
  },
  {
    q: "Do you work with clients outside Uganda?",
    a: "Absolutely. We serve customers in 30+ countries. Remote collaboration is built into our process — async updates, shared workspaces, scheduled calls.",
  },
];

const testimonials = [
  {
    quote:
      "The TrueWorks team rebuilt our entire operations manual in two weeks. It's the cleanest document our team has ever used.",
    author: "Sarah N.",
    role: "COO, Logistics Co.",
  },
  {
    quote:
      "We use their template packs to onboard new managers faster. The quality is consistent and the support team actually replies.",
    author: "David K.",
    role: "Founder, SaaS Startup",
  },
];

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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

export default function ContactContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convexClient) {
      setError(
        "Service unavailable. Please email us directly at info@trueworksgroup.com",
      );
      return;
    }
    setSending(true);
    setError("");
    try {
      await convexClient.mutation(api.contact.create, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const scrollToForm = (subject: string) => {
    setFormData((prev) => ({ ...prev, subject }));
    document
      .getElementById("contact-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent/[0.10] blur-3xl" aria-hidden />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/[0.20] blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-light backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  Contact our team
                </div>
              </FadeIn>
              <FadeIn delay={0.08}>
                <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                  Let&apos;s build something{" "}
                  <span className="text-gradient-gold">remarkable</span> together.
                </h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                  Have a question about our templates, need a custom solution, or
                  want to partner with TrueWorks? Send a message and we&apos;ll
                  respond within one business day.
                </p>
              </FadeIn>
              <FadeIn delay={0.24}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="gradient-gold font-semibold text-primary-dark shadow-lg shadow-accent/30 hover:brightness-105"
                    onClick={() =>
                      document
                        .getElementById("contact-form")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Send a message
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <a
                    href="mailto:info@trueworksgroup.com"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-white/25 bg-white/[0.04] px-6 text-sm font-semibold text-white transition-colors hover:bg-white/[0.10] hover:text-white"
                  >
                    <Mail className="mr-1.5 h-4 w-4" />
                    Email directly
                  </a>
                </div>
              </FadeIn>
              <FadeIn delay={0.32}>
                <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
                  {[
                    "Replies within 24 hours",
                    "No bots, real humans",
                    "No spam, ever",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-accent-light" />
                      {t}
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>

            {/* Floating contact preview */}
            <FadeIn delay={0.2} className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent/20 via-accent/5 to-transparent blur-2xl" aria-hidden />
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                        Online · typically replies in 4h
                      </span>
                    </div>
                    <MessageCircle className="h-4 w-4 text-accent-light" />
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl rounded-tl-sm bg-white/[0.08] px-4 py-2.5 text-sm text-white/90">
                      Hi! I&apos;m interested in the business operating system.
                    </div>
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-accent/20 px-4 py-2.5 text-sm text-white">
                      Thanks for reaching out — happy to help. What kind of
                      business are you running?
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/[0.08] px-4 py-2.5 text-sm text-white/90">
                      A logistics startup in Nairobi, ~25 staff.
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white/50">
                    <span className="flex-1">Type your message…</span>
                    <Send className="h-3.5 w-3.5 text-accent-light" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Trust stats bar */}
          <FadeIn delay={0.4}>
            <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur sm:grid-cols-4">
              {trustStats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 bg-white/[0.02] px-5 py-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-light">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-heading text-lg font-semibold text-white">
                      {s.value}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-white/55">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Form + info ──────────────────────────────────────────────── */}
      <section id="contact-form" className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">
            {/* Form */}
            <FadeIn className="lg:col-span-3">
              <div className="rounded-2xl border border-border/70 bg-white p-7 shadow-card sm:p-9">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold text-primary">
                      Send us a message
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Tell us about your project or question. We&apos;ll get
                      back within one business day.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    All systems normal
                  </span>
                </div>

                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="status"
                    aria-live="polite"
                    className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        Message sent — we&apos;ll be in touch shortly.
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                        You&apos;ll receive a confirmation email and a personal
                        reply within 24 hours.
                      </p>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                  >
                    <span className="font-semibold">Almost there —</span>
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Full name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Jane Acacia"
                        className="h-11"
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        className="h-11"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+256 700 000 000"
                        className="h-11"
                        autoComplete="tel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">What can we help with?</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) =>
                          setFormData({ ...formData, subject: value ?? "" })
                        }
                      >
                        <SelectTrigger id="subject" className="h-11 w-full">
                          <SelectValue placeholder="Choose a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Inquiry">
                            General inquiry
                          </SelectItem>
                          <SelectItem value="Technical Support">
                            Technical support
                          </SelectItem>
                          <SelectItem value="Sales">Sales / pricing</SelectItem>
                          <SelectItem value="Template Request">
                            Custom template request
                          </SelectItem>
                          <SelectItem value="Partnership">
                            Partnership
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Your message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project, team size, timeline, and what you're trying to achieve…"
                      className="min-h-[140px] resize-y"
                      maxLength={5000}
                    />
                    <p className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>The more context, the better we can help.</span>
                      <span className="tabular-nums">
                        {formData.message.length} / 5000
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      By submitting, you agree to our{" "}
                      <Link
                        href="/privacy"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        privacy policy
                      </Link>
                      .
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={sending}
                      className="gradient-gold font-semibold text-primary-dark shadow-md shadow-accent/25 hover:brightness-105 disabled:opacity-60 sm:px-8"
                    >
                      {sending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {sending ? "Sending…" : "Send message"}
                    </Button>
                  </div>
                </form>
              </div>
            </FadeIn>

            {/* Contact info */}
            <div className="space-y-3 lg:col-span-2">
              {contactInfo.map((item, i) => {
                const Inner = (
                  <div
                    className={cn(
                      "relative flex items-start gap-4 overflow-hidden rounded-xl border border-border/70 bg-white p-5 shadow-card transition-all duration-300",
                      item.href &&
                        "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-elevated",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-60",
                        item.accent,
                      )}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white ring-1",
                        item.ring,
                        item.iconColor,
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div className="relative min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.title}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-sm font-semibold",
                          item.href ? "text-primary" : "text-foreground",
                        )}
                      >
                        {item.detail}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.sub}
                      </p>
                    </div>
                    {item.href && (
                      <ArrowUpRight className="relative ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    )}
                  </div>
                );
                return (
                  <FadeIn key={item.title} delay={i * 0.05}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                        className="group block"
                        aria-label={`${item.title}: ${item.detail}`}
                      >
                        {Inner}
                      </a>
                    ) : (
                      Inner
                    )}
                  </FadeIn>
                );
              })}

              {/* Location card */}
              <FadeIn delay={0.2}>
                <div className="gradient-brand relative overflow-hidden rounded-xl p-6 shadow-card">
                  <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                  <div className="relative flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-accent-light ring-1 ring-white/15">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-light">
                        Our office
                      </p>
                      <p className="mt-1 font-heading text-lg font-semibold text-white">
                        TrueWorks Limited
                      </p>
                      <p className="mt-0.5 text-sm text-white/80">
                        Plot 42, Acacia Avenue
                        <br />
                        Kampala, Uganda
                      </p>
                      <a
                        href="https://maps.google.com/?q=Plot+42+Acacia+Avenue+Kampala"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-light transition-colors hover:text-white"
                      >
                        Get directions
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Map ──────────────────────────────────────────────────────── */}
      <section className="bg-surface pb-16 lg:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl border border-border/70 shadow-card">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-surface to-transparent" aria-hidden />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-surface to-transparent" aria-hidden />
              <iframe
                src="https://www.google.com/maps?q=Acacia+Avenue,+Kampala,+Uganda&output=embed"
                width="100%"
                height="420"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="TrueWorks Limited — Plot 42, Acacia Avenue, Kampala"
                className="w-full grayscale-[20%]"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Support paths ────────────────────────────────────────────── */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              How can we help?
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              Choose what fits your needs
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Pick the path that matches your goal and we&apos;ll route your
              message to the right specialist on the team.
            </p>
          </FadeIn>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {supportCards.map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.06}>
                <button
                  onClick={() => scrollToForm(card.subject)}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-surface p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-white hover:shadow-elevated"
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      card.accent,
                    )}
                    aria-hidden
                  />
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-accent shadow-sm">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <h3 className="relative mt-4 font-heading text-lg font-semibold text-primary">
                    {card.title}
                  </h3>
                  <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                  <span className="relative mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-accent-dark transition-transform group-hover:translate-x-0.5">
                    {card.linkText}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials band ────────────────────────────────────────── */}
      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              What clients say
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              Trusted by teams across the region
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <FadeIn key={t.author} delay={i * 0.08}>
                <figure className="relative h-full rounded-2xl border border-border/70 bg-white p-7 shadow-card">
                  <Quote className="absolute right-5 top-5 h-7 w-7 text-accent/30" />
                  <blockquote className="text-base leading-relaxed text-foreground/90">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-semibold text-primary">
                      {t.author.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t.author}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              FAQ
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              Quick answers
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="mt-10">
            <Accordion className="rounded-2xl border border-border/70 bg-white px-2 shadow-card">
              {faqItems.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`faq-${i}`}
                  className="px-4"
                >
                  <AccordionTrigger className="text-left font-heading text-base font-semibold text-primary hover:text-accent-dark">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
          <FadeIn delay={0.2} className="mt-8 text-center text-sm text-muted-foreground">
            Still have questions?{" "}
            <button
              onClick={() =>
                document
                  .getElementById("contact-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Drop us a message
            </button>{" "}
            and we&apos;ll respond within 24 hours.
          </FadeIn>
        </div>
      </section>
    </>
  );
}
