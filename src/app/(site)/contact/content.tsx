"use client";

import { useState } from "react";
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
  CheckCircle2,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const contactInfo = [
  { icon: Mail, title: "Email Us", detail: "hello@trueworksgroup.com", sub: "We respond within 24 hours", href: "mailto:hello@trueworksgroup.com" },
  { icon: Phone, title: "Call Us", detail: "+256 700 123 456", sub: "Available during business hours", href: "tel:+256700123456" },
  { icon: MessageCircle, title: "WhatsApp", detail: "+256 700 123 456", sub: "Chat with us on WhatsApp", href: "https://wa.me/256700123456" },
  { icon: Clock, title: "Business Hours", detail: "Mon – Fri: 8:00 – 17:00", sub: "Saturday: 9:00 – 13:00 EAT", href: undefined },
  { icon: MapPin, title: "Location", detail: "Kampala, Uganda", sub: "Plot 42, Acacia Avenue", href: undefined },
];

const supportCards = [
  { icon: Headphones, title: "Technical Support", description: "Having trouble with a template or dashboard? Our team will get you back on track.", linkText: "Get Support", subject: "Technical Support" },
  { icon: ShoppingBag, title: "Sales Inquiries", description: "Interested in our products or need a quote for bulk purchases? Talk to sales.", linkText: "Contact Sales", subject: "Sales" },
  { icon: FileDown, title: "Template Requests", description: "Need a custom template for your organization? We build tailored solutions.", linkText: "Request Template", subject: "Template Request" },
  { icon: Handshake, title: "Partnerships", description: "Looking to partner with TrueWorks? We collaborate across the Globe and beyond.", linkText: "Explore Partnerships", subject: "Partnership" },
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

export default function ContactContent() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convexClient) {
      setError("Service unavailable. Please email us directly at hello@trueworksgroup.com");
      return;
    }
    setSending(true);
    setError("");
    try {
      await convexClient.mutation(api.contact.create, {
        name: formData.name,
        email: formData.email,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const scrollToForm = (subject: string) => {
    setFormData((prev) => ({ ...prev, subject }));
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Hero */}
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/[0.08] blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
              Contact
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="mt-4 font-heading text-4xl font-semibold text-white sm:text-5xl">
              Let&apos;s Talk
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70 sm:text-lg">
              Have a question about our templates or need a custom solution?
              Our team is ready to help.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Form + info */}
      <section id="contact-form" className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">
            {/* Form */}
            <FadeIn className="lg:col-span-3">
              <div className="rounded-2xl border border-border/70 bg-white p-7 shadow-card sm:p-9">
                <h2 className="font-heading text-2xl font-semibold text-primary">
                  Send Us a Message
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Fill out the form below and we&apos;ll get back to you within
                  one business day.
                </p>

                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center gap-2.5 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Thank you! Your message has been sent successfully.
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="Your full name" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" className="h-11" />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+256 700 000 000" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value ?? "" })}>
                        <SelectTrigger id="subject" className="h-11 w-full">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                          <SelectItem value="Technical Support">Technical Support</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Template Request">Template Request</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help..."
                      className="min-h-[130px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={sending}
                    className="gradient-gold px-7 font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105 disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {sending ? "Sending…" : "Send Message"}
                  </Button>
                </form>
              </div>
            </FadeIn>

            {/* Contact info */}
            <div className="space-y-4 lg:col-span-2">
              {contactInfo.map((item, i) => (
                <FadeIn key={item.title} delay={i * 0.06}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="flex items-start gap-4 rounded-xl border border-border/70 bg-white p-5 shadow-card transition-shadow duration-300 hover:shadow-elevated"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
                        <item.icon className="h-5 w-5 text-primary" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                        <span className="mt-0.5 block text-sm font-medium text-primary">{item.detail}</span>
                        <span className="mt-0.5 block text-xs text-muted">{item.sub}</span>
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-start gap-4 rounded-xl border border-border/70 bg-white p-5 shadow-card">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
                        <item.icon className="h-5 w-5 text-primary" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-0.5 text-sm font-medium text-primary">{item.detail}</p>
                        <p className="mt-0.5 text-xs text-muted">{item.sub}</p>
                      </div>
                    </div>
                  )}
                </FadeIn>
              ))}

              {/* Location card */}
              <FadeIn delay={0.3}>
                <div className="gradient-brand relative overflow-hidden rounded-xl p-6 shadow-card">
                  <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                  <div className="relative">
                    <MapPin className="h-7 w-7 text-accent" />
                    <p className="mt-3 font-heading text-lg font-semibold text-white">
                      TrueWorks Limited
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      Plot 42, Acacia Avenue
                      <br />
                      Kampala, Uganda
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="bg-surface pb-16 lg:pb-20 lg:-mt-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="overflow-hidden rounded-2xl border border-border/70 shadow-card">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.654!2d32.574!3d0.313!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sKampala!5e0!3m2!1sen!2sug!4v1"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="TrueWorks Limited location - Plot 42, Acacia Avenue, Kampala"
                className="w-full"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Support paths */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              How Can We Help?
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary sm:text-4xl">
              Choose What Fits Your Needs
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {supportCards.map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-xl border border-border/70 bg-surface p-6 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-elevated">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary">
                    <card.icon className="h-5 w-5 text-accent" />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-primary">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {card.description}
                  </p>
                  <button
                    onClick={() => scrollToForm(card.subject)}
                    className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-accent-dark transition-colors hover:text-primary"
                  >
                    {card.linkText}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
