"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms", content: "By accessing or using the TrueWorks Limited website and purchasing our products, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services." },
  { id: "pricing", title: "2. Products and Pricing", content: "All prices are listed in Ugandan Shillings (UGX) unless otherwise stated. We reserve the right to modify prices at any time without prior notice. Products are digital templates and dashboards delivered via instant download after payment confirmation." },
  { id: "payment", title: "3. Payment Methods", content: "We accept payments via MTN Mobile Money, Airtel Money, Visa, and Mastercard. Payment is processed securely through our checkout system. Your payment information is never stored on our servers." },
  { id: "delivery", title: "4. Digital Delivery", content: "Upon successful payment, you will receive immediate access to download your purchased template. A download link will also be sent to the email address you provided. It is your responsibility to ensure the email address is correct." },
  { id: "refunds", title: "5. Refund and Exchange Policy", content: "We offer a 30-day satisfaction guarantee. If a template does not meet your needs, contact us and we will make it right or issue a full refund. Refund requests must be submitted within 30 days of purchase." },
  { id: "license", title: "6. License and Usage", content: "When you purchase a template, you receive a single-user license. You may use the template for your personal or organizational purposes. You may not resell, redistribute, or sublicense the template or any derivative works." },
  { id: "ip", title: "7. Intellectual Property", content: "All templates, dashboards, designs, and content on this website are the intellectual property of TrueWorks Limited unless otherwise stated. Unauthorized reproduction or distribution is prohibited." },
  { id: "accounts", title: "8. User Accounts", content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use." },
  { id: "liability", title: "9. Limitation of Liability", content: "TrueWorks Limited shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use our products. Our total liability shall not exceed the amount paid for the product in question." },
  { id: "changes", title: "10. Changes to Terms", content: "We reserve the right to update these terms at any time. Changes will be posted on this page with an updated effective date. Continued use of our services after changes constitutes acceptance of the new terms." },
  { id: "contact", title: "11. Contact", content: "For questions about these terms, contact us at hello@trueworksug.com, via WhatsApp at +256 700 123 456, or visit our Contact page." },
];

export default function TermsContent() {
  return (
    <>
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center lg:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">Legal</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="mt-4 font-heading text-4xl font-semibold text-white sm:text-5xl">Terms of Service</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70 sm:text-lg">
              These terms govern your use of TrueWorks products and website.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_260px]">
            {/* Main content */}
            <div className="max-w-3xl">
              <FadeIn>
                <p className="text-sm text-muted"><strong>Effective Date:</strong> July 1, 2026</p>
              </FadeIn>
              <div className="mt-10 space-y-10">
                {sections.map((section, i) => (
                  <FadeIn key={section.id} delay={i * 0.04}>
                    <div id={section.id}>
                      <h2 className="font-heading text-xl font-semibold text-primary">{section.title}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{section.content}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-xl border border-border/70 bg-white p-5 shadow-card">
                  <h3 className="font-heading text-sm font-semibold text-primary">On this page</h3>
                  <ul className="mt-3 space-y-1">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="block rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-primary"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border/70 bg-white p-5 shadow-card">
                  <h3 className="font-heading text-sm font-semibold text-primary">Need help?</h3>
                  <p className="mt-2 text-xs text-muted">Our team is ready to assist.</p>
                  <div className="mt-4 space-y-2.5">
                    <a
                      href="mailto:hello@trueworksug.com"
                      className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-primary"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0 text-accent-dark" />
                      hello@trueworksug.com
                    </a>
                    <a
                      href="https://wa.me/256700123456"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-primary"
                    >
                      <MessageCircle className="h-3.5 w-3.5 shrink-0 text-accent-dark" />
                      Chat on WhatsApp
                    </a>
                  </div>
                  <Link
                    href="/contact"
                    className="mt-4 block rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-primary/80"
                  >
                    Contact page
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
