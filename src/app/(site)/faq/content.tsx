"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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

const faqCategories = [
  {
    id: "orders",
    name: "Orders & Payment",
    items: [
      { q: "How do I place an order?", a: "Browse our store, add templates to your cart, and proceed to checkout. You can pay with MTN Mobile Money, Airtel Money, Visa, or Mastercard." },
      { q: "Can I pay with mobile money?", a: "Yes, we accept MTN Mobile Money and Airtel Money. Select your preferred option at checkout and follow the prompts." },
      { q: "Do you offer receipts or invoices?", a: "Yes, a receipt is generated automatically after each purchase and sent to your email." },
      { q: "Is my payment information secure?", a: "Yes. Payments are processed through encrypted third-party gateways. We do not store your payment card details." },
    ],
  },
  {
    id: "delivery",
    name: "Delivery & Downloads",
    items: [
      { q: "How do I access my template after purchase?", a: "Immediately after payment, you will be redirected to a download page. A download link is also emailed to you." },
      { q: "I did not receive my download email. What should I do?", a: "Check your spam folder. If you still cannot find it, contact us at hello@trueworksug.com and we will resend the link." },
      { q: "Can I download my purchases again?", a: "Yes, download links remain active for 30 days after purchase. Log into your account to access past purchases." },
      { q: "Are the templates compatible with Google Sheets?", a: "Most of our templates work with Google Sheets. Check the compatibility section on each product page for details." },
    ],
  },
  {
    id: "refunds",
    name: "Refunds & Exchanges",
    items: [
      { q: "What is your refund policy?", a: "We offer a 30-day satisfaction guarantee. If a template does not meet your needs, contact us and we will make it right or issue a full refund." },
      { q: "How do I request a refund?", a: "Email us at hello@trueworksug.com or use our Contact form within 30 days of purchase. Include your order number and reason." },
      { q: "Can I exchange a template for another?", a: "Yes, we can arrange exchanges within 30 days of purchase. Contact us with your order details." },
    ],
  },
  {
    id: "customization",
    name: "Templates & Customization",
    items: [
      { q: "Can I customize the templates?", a: "Absolutely. Our templates are designed to be customized. Each comes with clear instructions and a data entry guide." },
      { q: "Do you offer custom template development?", a: "Yes, we build custom templates for organizations. Contact us with your requirements for a quote." },
      { q: "What software do I need to use the templates?", a: "Most templates require Microsoft Excel 2016 or later. Many also work with Google Sheets and Office 365." },
      { q: "Do you offer bulk pricing for organizations?", a: "Yes, we offer discounts for bulk purchases. Contact us for a quote." },
    ],
  },
  {
    id: "support",
    name: "Account & Support",
    items: [
      { q: "Do I need an account to purchase?", a: "You can purchase as a guest. Creating an account lets you access your purchase history and download links anytime." },
      { q: "How do I contact support?", a: "Email us at hello@trueworksug.com, send a message on WhatsApp at +256 700 123 456, or use the Contact form on our website." },
      { q: "What are your support hours?", a: "We respond within 24 hours during business days. Our standard hours are Monday to Friday, 8:00 to 17:00 EAT." },
    ],
  },
];

export default function FaqContent() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  const filtered = faqCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <>
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center lg:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">Help Center</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="mt-4 font-heading text-4xl font-semibold text-white sm:text-5xl">Frequently Asked Questions</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70 sm:text-lg">
              Everything you need to know about our templates, payments, and support.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_260px]">
            {/* Main content */}
            <div>
              <FadeIn>
                <div className="relative mb-10">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    type="text"
                    placeholder="Search FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full border-border bg-white pl-11"
                    aria-label="Search frequently asked questions"
                  />
                </div>
              </FadeIn>

              {filtered.length > 0 ? (
                filtered.map((category, ci) => (
                  <div key={category.id} id={category.id} className="mb-12 last:mb-0">
                    <FadeIn delay={ci * 0.05}>
                      <h2 className="font-heading text-xl font-semibold text-primary">{category.name}</h2>
                    </FadeIn>
                    <div className="mt-5 space-y-3">
                      {category.items.map((item, ii) => {
                        const key = `${ci}-${ii}`;
                        const isOpen = openIndex === key;
                        return (
                          <FadeIn key={key} delay={ci * 0.05 + ii * 0.03}>
                            <div className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-card">
                              <button
                                onClick={() => toggle(key)}
                                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-surface/50"
                              >
                                <span className="pr-4 font-medium text-primary">{item.q}</span>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                                    isOpen && "rotate-180"
                                  )}
                                />
                              </button>
                              <AnimatePresence initial={false}>
                                {isOpen && (
                                  <motion.div
                                    key="content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                  >
                                    <div className="border-t border-border/60 px-6 py-4">
                                      <p className="text-sm leading-relaxed text-muted">{item.a}</p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </FadeIn>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20 text-center">
                  <p className="font-heading text-lg font-semibold text-primary">No results found</p>
                  <p className="mt-1 text-sm text-muted">Try a different search term or browse the categories above.</p>
                  <button onClick={() => setSearchQuery("")} className="mt-4 text-sm font-semibold text-accent-dark hover:text-primary">
                    Clear search
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-xl border border-border/70 bg-white p-5 shadow-card">
                  <h3 className="font-heading text-sm font-semibold text-primary">Categories</h3>
                  <ul className="mt-3 space-y-1">
                    {faqCategories.map((cat) => (
                      <li key={cat.id}>
                        <a
                          href={`#${cat.id}`}
                          className="block rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-primary"
                        >
                          {cat.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border/70 bg-white p-5 shadow-card">
                  <h3 className="font-heading text-sm font-semibold text-primary">Still have questions?</h3>
                  <p className="mt-2 text-xs text-muted">We are here to help.</p>
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
